"""
Core logic for fetching GTFS-Realtime Protocol Buffers,
reading static GTFS data (from memory), and merging both layers.

This module is responsible for:
- Managing in-memory state for GTFS-RT feed URLs and static GTFS DataFrames.
- Downloading and parsing Protobuf feeds via HTTP.
- Merging real-time vehicle positions with static route/trip/fare metadata.
- Building GeoJSON FeatureCollections for trip shapes and stops.
"""

import io
import json
import os
import zipfile
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from google.transit import gtfs_realtime_pb2


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GTFS_STATIC_FILES = [
    "shapes", "routes", "stops", "stop_times",
    "trips", "fare_attributes", "fare_rules",
]

DEFAULT_RT_URLS: Dict[str, str] = {
    "vehicle_positions": "",
    "trip_updates": "",
    "alerts": "",
}


# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------

class GTFSState:
    """Singleton-style container for in-memory GTFS data and feed URLs."""

    def __init__(self) -> None:
        self.rt_urls: Dict[str, str] = dict(DEFAULT_RT_URLS)
        self.static_data: Dict[str, Optional[pd.DataFrame]] = {
            name: None for name in GTFS_STATIC_FILES
        }
        self.networks_file = "networks.json"
        self.networks: Dict[str, Dict[str, str]] = self._load_networks()

    def _load_networks(self) -> Dict[str, Dict[str, str]]:
        """Load saved networks from local JSON file."""
        if os.path.exists(self.networks_file):
            try:
                with open(self.networks_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading networks: {e}")
        return {}

    def _save_networks(self) -> None:
        """Persist current networks to local JSON file."""
        try:
            with open(self.networks_file, "w") as f:
                json.dump(self.networks, f, indent=4)
        except Exception as e:
            print(f"Error saving networks: {e}")

    def add_network(self, name: str, vp: str, tu: str, alerts: str) -> None:
        """Add or update a network preset."""
        self.networks[name] = {
            "vehicle_positions": vp,
            "trip_updates": tu,
            "alerts": alerts,
        }
        self._save_networks()

    def delete_network(self, name: str) -> bool:
        """Remove a network preset."""
        if name in self.networks:
            del self.networks[name]
            self._save_networks()
            return True
        return False

    def set_urls(
        self,
        vehicle_positions: Optional[str] = None,
        trip_updates: Optional[str] = None,
        alerts: Optional[str] = None,
    ) -> None:
        """Update one or more GTFS-RT feed endpoints."""
        if vehicle_positions:
            self.rt_urls["vehicle_positions"] = vehicle_positions
        if trip_updates:
            self.rt_urls["trip_updates"] = trip_updates
        if alerts:
            self.rt_urls["alerts"] = alerts

    def load_static_zip(self, file_content: bytes) -> Dict[str, str]:
        """
        Parse a GTFS .zip from raw bytes into Pandas DataFrames.

        Uses ``utf-8-sig`` encoding to automatically strip the BOM sequence
        (\\ufeff) that many government transit exports embed in their CSVs.
        """
        try:
            with zipfile.ZipFile(io.BytesIO(file_content)) as z:
                for name in GTFS_STATIC_FILES:
                    filename = f"{name}.txt"
                    if filename in z.namelist():
                        with z.open(filename) as f:
                            self.static_data[name] = pd.read_csv(
                                f, dtype=str, encoding="utf-8-sig"
                            )
            return {
                "status": "success",
                "message": "Static GTFS loaded successfully",
            }
        except Exception as e:
            print(f"Error loading GTFS static zip: {e}")
            return {"status": "error", "message": "Failed to process the uploaded GTFS file."}


# Module-level singleton
state = GTFSState()


# ---------------------------------------------------------------------------
# Feed Fetching
# ---------------------------------------------------------------------------

def fetch_feed(url: str) -> Optional[gtfs_realtime_pb2.FeedMessage]:
    """Download and parse a GTFS-RT Protobuf from the given *url*."""
    if not url:
        return None
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)
        return feed
    except Exception as e:
        print(f"Error fetching feed at {url}: {e}")
        return None


# ---------------------------------------------------------------------------
# Real-Time Data Processing
# ---------------------------------------------------------------------------

def _safe_str(df: pd.DataFrame, row_idx: int, col: str) -> str:
    """Return a stripped string value from *df* or empty string on failure."""
    if col not in df.columns:
        return ""
    val = df.iloc[row_idx][col]
    if pd.isna(val):
        return ""
    s = str(val).strip()
    return "" if s.lower() == "nan" else s


def _enrich_vehicle(
    route_id: Optional[str],
    trip_id: Optional[str],
    routes_df: Optional[pd.DataFrame],
    trips_df: Optional[pd.DataFrame],
    fa_df: Optional[pd.DataFrame],
    fr_df: Optional[pd.DataFrame],
) -> Dict[str, Any]:
    """
    Look up static GTFS metadata for a vehicle's route and trip.

    Returns a dict with enriched fields (all default to empty/"").
    """
    enriched: Dict[str, Any] = {
        "route_short_name": "",
        "route_long_name": "",
        "route_desc": "",
        "route_color": "",
        "trip_headsign": "",
        "direction_id": "",
        "fare_price": None,
        "fare_currency": "BRL",
    }

    route_id_str = str(route_id).strip() if route_id else ""

    # --- Route info ---
    if route_id_str and routes_df is not None and not routes_df.empty:
        r = routes_df[routes_df["route_id"].astype(str).str.strip() == route_id_str]
        if not r.empty:
            enriched["route_long_name"] = _safe_str(r, 0, "route_long_name")
            enriched["route_short_name"] = _safe_str(r, 0, "route_short_name")
            enriched["route_desc"] = _safe_str(r, 0, "route_desc")
            color = _safe_str(r, 0, "route_color")
            if color:
                enriched["route_color"] = color.replace("#", "")

    # --- Fare info ---
    if (
        route_id_str
        and fr_df is not None
        and fa_df is not None
        and not fr_df.empty
        and not fa_df.empty
    ):
        rule = fr_df[fr_df["route_id"].astype(str).str.strip() == route_id_str]
        if not rule.empty:
            fare_id = str(rule.iloc[0]["fare_id"]).strip()
            fare_attr = fa_df[fa_df["fare_id"].astype(str).str.strip() == fare_id]
            if not fare_attr.empty:
                price = _safe_str(fare_attr, 0, "price")
                if price:
                    enriched["fare_price"] = float(price)
                currency = _safe_str(fare_attr, 0, "currency_type")
                if currency:
                    enriched["fare_currency"] = currency

    # --- Trip info ---
    if trip_id and trips_df is not None and not trips_df.empty:
        t = trips_df[trips_df["trip_id"] == trip_id]
        if not t.empty:
            enriched["trip_headsign"] = _safe_str(t, 0, "trip_headsign")
            dir_val = _safe_str(t, 0, "direction_id")
            if dir_val in ("0", "1"):
                enriched["direction_id"] = dir_val

    return enriched


def process_rt_data() -> Dict[str, List]:
    """
    Fetch current RT feeds and compile them into a JSON-serializable dict.

    Returns ``{"vehicles": [...], "alerts": [...], "trip_updates": [...]}``.
    """
    vp_feed = fetch_feed(state.rt_urls["vehicle_positions"])
    tu_feed = fetch_feed(state.rt_urls["trip_updates"])
    al_feed = fetch_feed(state.rt_urls["alerts"])

    # Reference static DataFrames
    routes_df = state.static_data.get("routes")
    trips_df = state.static_data.get("trips")
    fa_df = state.static_data.get("fare_attributes")
    fr_df = state.static_data.get("fare_rules")

    # --- Vehicles ---
    vehicles: List[Dict[str, Any]] = []
    if vp_feed:
        for entity in vp_feed.entity:
            if not entity.HasField("vehicle"):
                continue
            v = entity.vehicle

            route_id = v.trip.route_id if v.HasField("trip") else None
            trip_id = v.trip.trip_id if v.HasField("trip") else None
            start_time = (
                v.trip.start_time
                if v.HasField("trip") and v.trip.HasField("start_time")
                else ""
            )

            enriched = _enrich_vehicle(
                route_id, trip_id, routes_df, trips_df, fa_df, fr_df
            )

            vehicles.append({
                "id": entity.id,
                "trip_id": trip_id,
                "route_id": route_id,
                "lat": v.position.latitude,
                "lon": v.position.longitude,
                "bearing": v.position.bearing if v.position.HasField("bearing") else 0,
                "speed": v.position.speed if v.position.HasField("speed") else 0,
                "timestamp": v.timestamp,
                "vehicle_id": v.vehicle.id if v.HasField("vehicle") else None,
                "label": v.vehicle.label if v.HasField("vehicle") else None,
                "start_time": start_time,
                **enriched,
            })

    # --- Alerts ---
    alerts: List[Dict[str, Any]] = []
    if al_feed:
        for entity in al_feed.entity:
            if not entity.HasField("alert"):
                continue
            alert = entity.alert
            header = (
                alert.header_text.translation[0].text
                if len(alert.header_text.translation) > 0
                else ""
            )
            desc = (
                alert.description_text.translation[0].text
                if len(alert.description_text.translation) > 0
                else ""
            )
            alerts.append({
                "id": entity.id,
                "header": header,
                "description": desc,
                "cause": alert.cause,
                "effect": alert.effect,
            })

    # --- Trip Updates ---
    trip_updates: List[Dict[str, Any]] = []
    if tu_feed:
        for entity in tu_feed.entity:
            if not entity.HasField("trip_update"):
                continue
            tu = entity.trip_update
            trip_updates.append({
                "trip_id": tu.trip.trip_id,
                "route_id": tu.trip.route_id,
                "vehicle_id": tu.vehicle.id if tu.HasField("vehicle") else None,
            })

    return {
        "vehicles": vehicles,
        "alerts": alerts,
        "trip_updates": trip_updates,
    }


# ---------------------------------------------------------------------------
# Shape / GeoJSON Helpers
# ---------------------------------------------------------------------------

def _build_shape_geojson(shape_id: str) -> Optional[Dict]:
    """Build a GeoJSON LineString Feature from the shapes DataFrame."""
    shapes_df = state.static_data.get("shapes")
    if shapes_df is None:
        return None

    route_shapes = shapes_df[
        shapes_df["shape_id"].astype(str).str.strip() == str(shape_id).strip()
    ].copy()

    if route_shapes.empty:
        return None

    route_shapes["shape_pt_sequence"] = pd.to_numeric(route_shapes["shape_pt_sequence"])
    route_shapes = route_shapes.sort_values(by="shape_pt_sequence")

    coordinates = [
        [float(row["shape_pt_lon"]), float(row["shape_pt_lat"])]
        for _, row in route_shapes.iterrows()
    ]

    return {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": coordinates},
        "properties": {"shape_id": shape_id, "type": "shape"},
    }


def get_trip_shape(trip_id: str) -> Optional[Dict]:
    """
    Build a GeoJSON FeatureCollection for a specific *trip_id*.

    Includes:
    - A ``LineString`` feature from the shapes table.
    - ``Point`` features for each stop along the trip (via stop_times → stops).
    """
    trips_df = state.static_data.get("trips")
    if trips_df is None:
        return None

    trip_row = trips_df[trips_df["trip_id"] == trip_id]
    if trip_row.empty:
        return None

    features: List[Dict] = []

    # Shape geometry
    shape_id = trip_row.iloc[0]["shape_id"]
    if pd.notna(shape_id):
        shape_feature = _build_shape_geojson(str(shape_id))
        if shape_feature:
            features.append(shape_feature)

    # Stop markers
    st_df = state.static_data.get("stop_times")
    stops_df = state.static_data.get("stops")

    if st_df is not None and stops_df is not None:
        trip_id_str = str(trip_id).strip()
        trip_stops = st_df[st_df["trip_id"].astype(str).str.strip() == trip_id_str]

        for _, row in trip_stops.iterrows():
            stop_id = str(row["stop_id"]).strip()
            s = stops_df[stops_df["stop_id"].astype(str).str.strip() == stop_id]
            if s.empty:
                continue

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        float(s.iloc[0]["stop_lon"]),
                        float(s.iloc[0]["stop_lat"]),
                    ],
                },
                "properties": {
                    "type": "stop",
                    "stop_id": stop_id,
                    "stop_name": _safe_str(s, 0, "stop_name") or "N/A",
                    "stop_desc": _safe_str(s, 0, "stop_desc"),
                    "stop_code": _safe_str(s, 0, "stop_code"),
                    "location_type": _safe_str(s, 0, "location_type"),
                    "parent_station": _safe_str(s, 0, "parent_station"),
                    "platform_code": _safe_str(s, 0, "platform_code"),
                    "zone_id": _safe_str(s, 0, "zone_id"),
                },
            })

    return {"type": "FeatureCollection", "features": features} if features else None

"""
Core logic for fetching GTFS-Realtime Protocol Buffers, 
reading static GTFS data (from memory), and merging both layers.
"""
import requests
from google.transit import gtfs_realtime_pb2
import zipfile
import pandas as pd
import io
from typing import Dict, Any, Optional

class GTFSState:
    """Class to manage in-memory static GTFS and API URLs."""
    def __init__(self):
        self.rt_urls = {
            "vehicle_positions": "http://realtime4.mobilibus.com/web/4ch6j/vehicle-positions?accesskey=982a57efd77a9462bf1665696fb25984",
            "trip_updates": "http://realtime4.mobilibus.com/web/4ch6j/trip-updates?accesskey=982a57efd77a9462bf1665696fb25984",
            "alerts": "http://realtime4.mobilibus.com/web/4ch6j/alerts?accesskey=982a57efd77a9462bf1665696fb25984"
        }
        self.static_data = {
            "shapes": None,
            "routes": None,
            "stops": None,
            "stop_times": None,
            "trips": None,
            "fare_attributes": None,
            "fare_rules": None
        }

    def set_urls(self, vehicle_positions, trip_updates, alerts):
        if vehicle_positions:
            self.rt_urls["vehicle_positions"] = vehicle_positions
        if trip_updates:
            self.rt_urls["trip_updates"] = trip_updates
        if alerts:
            self.rt_urls["alerts"] = alerts

    def load_static_zip(self, file_content):
        # Read the zip file stream into pandas DataFrames
        try:
            with zipfile.ZipFile(io.BytesIO(file_content)) as z:
                # Use encoding utf-8-sig to drop the BOM sequence \ufeff that breaks GTFS headers
                if 'shapes.txt' in z.namelist():
                    with z.open('shapes.txt') as f:
                        self.static_data['shapes'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
                if 'routes.txt' in z.namelist():
                    with z.open('routes.txt') as f:
                        self.static_data['routes'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
                if 'stops.txt' in z.namelist():
                    with z.open('stops.txt') as f:
                        self.static_data['stops'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
                if 'stop_times.txt' in z.namelist():
                    with z.open('stop_times.txt') as f:
                        self.static_data['stop_times'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
                if 'trips.txt' in z.namelist():
                    with z.open('trips.txt') as f:
                        self.static_data['trips'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
                if 'fare_attributes.txt' in z.namelist():
                    with z.open('fare_attributes.txt') as f:
                        self.static_data['fare_attributes'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
                if 'fare_rules.txt' in z.namelist():
                    with z.open('fare_rules.txt') as f:
                        self.static_data['fare_rules'] = pd.read_csv(f, dtype=str, encoding='utf-8-sig')
            return {"status": "success", "message": "Static GTFS loaded successfully / GTFS estático carregado com sucesso"}
        except Exception as e:
            print("Error loading GTFS static zip:", e)
            return {"status": "error", "message": str(e)}

state = GTFSState()

def fetch_feed(url: str) -> Optional[gtfs_realtime_pb2.FeedMessage]:
    """Helper method to download and parse a GTFS-RT Protobuf given a raw URL."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)
        return feed
    except Exception as e:
        print(f"Error fetching feed at {url}: {e}")
        return None

def process_rt_data():
    """Fetch current RT feeds and compile them into a dictionary suitable for JSON response."""
    vp_feed = fetch_feed(state.rt_urls["vehicle_positions"])
    tu_feed = fetch_feed(state.rt_urls["trip_updates"])
    al_feed = fetch_feed(state.rt_urls["alerts"])

    vehicles = []
    routes_df = state.static_data.get('routes')
    trips_df = state.static_data.get('trips')
    fa_df = state.static_data.get('fare_attributes')
    fr_df = state.static_data.get('fare_rules')

    if vp_feed:
        for entity in vp_feed.entity:
            if entity.HasField('vehicle'):
                v = entity.vehicle
                
                route_id = v.trip.route_id if v.HasField('trip') else None
                trip_id = v.trip.trip_id if v.HasField('trip') else None
                
                route_long_name = ""
                route_short_name = ""
                route_desc = ""
                route_color = ""
                trip_headsign = ""
                direction_id = ""
                fare_price = None
                fare_currency = "BRL"
                start_time = v.trip.start_time if v.HasField('trip') and v.trip.HasField('start_time') else ""
                
                # Fetch Route Info
                if route_id and routes_df is not None and not routes_df.empty:
                    route_id_str = str(route_id).strip()
                    # Ensure both lookup table and parameter are clean stripped strings
                    r = routes_df[routes_df['route_id'].astype(str).str.strip() == route_id_str]
                    if not r.empty:
                        if 'route_long_name' in r.columns and pd.notna(r.iloc[0]['route_long_name']):
                            val = str(r.iloc[0]['route_long_name']).strip()
                            if val.lower() != 'nan': route_long_name = val
                        if 'route_short_name' in r.columns and pd.notna(r.iloc[0]['route_short_name']):
                            val = str(r.iloc[0]['route_short_name']).strip()
                            if val.lower() != 'nan': route_short_name = val
                        if 'route_desc' in r.columns and pd.notna(r.iloc[0]['route_desc']):
                            val = str(r.iloc[0]['route_desc']).strip()
                            if val.lower() != 'nan': route_desc = val
                        if 'route_color' in r.columns and pd.notna(r.iloc[0]['route_color']):
                            color_val = str(r.iloc[0]['route_color']).strip()
                            if color_val and color_val.lower() != 'nan':
                                route_color = color_val.replace('#', '')

                # Fetch Fare Info
                if route_id and fr_df is not None and fa_df is not None and not fr_df.empty and not fa_df.empty:
                    rule = fr_df[fr_df['route_id'].astype(str).str.strip() == route_id_str]
                    if not rule.empty:
                        fare_id = str(rule.iloc[0]['fare_id']).strip()
                        fare_attr = fa_df[fa_df['fare_id'].astype(str).str.strip() == fare_id]
                        if not fare_attr.empty:
                            if 'price' in fare_attr.columns and pd.notna(fare_attr.iloc[0]['price']):
                                fare_price = float(fare_attr.iloc[0]['price'])
                            if 'currency_type' in fare_attr.columns and pd.notna(fare_attr.iloc[0]['currency_type']):
                                fare_currency = str(fare_attr.iloc[0]['currency_type'])

                # Fetch Trip Info
                if trip_id and trips_df is not None and not trips_df.empty:
                    t = trips_df[trips_df['trip_id'] == trip_id]
                    if not t.empty:
                        if 'trip_headsign' in t.columns and pd.notna(t.iloc[0]['trip_headsign']):
                            trip_headsign = str(t.iloc[0]['trip_headsign'])
                        if 'direction_id' in t.columns and pd.notna(t.iloc[0]['direction_id']):
                            direction_id = str(int(t.iloc[0]['direction_id']))

                vehicles.append({
                    "id": entity.id,
                    "trip_id": trip_id,
                    "route_id": route_id,
                    "lat": v.position.latitude,
                    "lon": v.position.longitude,
                    "bearing": v.position.bearing if v.position.HasField('bearing') else 0,
                    "speed": v.position.speed if v.position.HasField('speed') else 0,
                    "timestamp": v.timestamp,
                    "vehicle_id": v.vehicle.id if v.HasField('vehicle') else None,
                    "label": v.vehicle.label if v.HasField('vehicle') else None,
                    "route_short_name": route_short_name,
                    "route_long_name": route_long_name,
                    "route_desc": route_desc,
                    "route_color": route_color,
                    "trip_headsign": trip_headsign,
                    "direction_id": direction_id,
                    "fare_price": fare_price,
                    "fare_currency": fare_currency,
                    "start_time": start_time
                })
    
    # Optionally parse alerts and trip updates too, but simple parsing for now
    alerts = []
    if al_feed:
        for entity in al_feed.entity:
            if entity.HasField('alert'):
                alert = entity.alert
                header = alert.header_text.translation[0].text if len(alert.header_text.translation) > 0 else ""
                desc = alert.description_text.translation[0].text if len(alert.description_text.translation) > 0 else ""
                alerts.append({
                    "id": entity.id,
                    "header": header,
                    "description": desc,
                    "cause": alert.cause,
                    "effect": alert.effect
                })

    trip_updates = []
    if tu_feed:
        for entity in tu_feed.entity:
            if entity.HasField('trip_update'):
                tu = entity.trip_update
                trip_updates.append({
                    "trip_id": tu.trip.trip_id,
                    "route_id": tu.trip.route_id,
                    "vehicle_id": tu.vehicle.id if tu.HasField('vehicle') else None
                })

    return {
        "vehicles": vehicles,
        "alerts": alerts,
        "trip_updates": trip_updates
    }

def get_shape_geojson(shape_id):
    """Retrieve GeoJSON line string for a specific shape_id from static data"""
    if state.static_data['shapes'] is None:
        return None
    
    shapes_df = state.static_data['shapes']
    # Filter by shape_id
    route_shapes = shapes_df[shapes_df['shape_id'].astype(str).str.strip() == str(shape_id).strip()].copy()
    if route_shapes.empty:
        return None
        
    route_shapes['shape_pt_sequence'] = pd.to_numeric(route_shapes['shape_pt_sequence'])
    route_shapes = route_shapes.sort_values(by='shape_pt_sequence')
    
    coordinates = []
    for _, row in route_shapes.iterrows():
        # GeoJSON is [lon, lat]
        coordinates.append([float(row['shape_pt_lon']), float(row['shape_pt_lat'])])
        
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        },
        "properties": {
            "shape_id": shape_id
        }
    }

def get_trip_shape(trip_id):
    """Get the GeoJSON shape for a given trip_id"""
    if state.static_data['trips'] is None:
        return None
    
    trips_df = state.static_data['trips']
    trip_row = trips_df[trips_df['trip_id'] == trip_id]
    if trip_row.empty:
        return None
    
    shape_id = trip_row.iloc[0]['shape_id']
    features = []
    
    if pd.notna(shape_id):
        shape_feature = get_shape_geojson(str(shape_id))
        if shape_feature:
            shape_feature['properties']['type'] = 'shape'
            features.append(shape_feature)
            
    # Add Stops
    if state.static_data.get('stop_times') is not None and state.static_data.get('stops') is not None:
        st_df = state.static_data['stop_times']
        stops_df = state.static_data['stops']
        
        trip_id_str = str(trip_id).strip()
        trip_stops = st_df[st_df['trip_id'].astype(str).str.strip() == trip_id_str]
        
        for _, row in trip_stops.iterrows():
            stop_id = str(row['stop_id']).strip()
            s = stops_df[stops_df['stop_id'].astype(str).str.strip() == stop_id]
            if not s.empty:
                s_row = s.iloc[0]
                
                def get_s(c):
                   if c in s_row.index and pd.notna(s_row[c]):
                       c_val = str(s_row[c]).strip()
                       if c_val.lower() != 'nan': return c_val
                   return ''
                   
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(s_row['stop_lon']), float(s_row['stop_lat'])]
                    },
                    "properties": {
                        "type": "stop",
                        "stop_id": stop_id,
                        "stop_name": get_s('stop_name') or 'Sem Nome',
                        "stop_desc": get_s('stop_desc'),
                        "stop_code": get_s('stop_code'),
                        "location_type": get_s('location_type'),
                        "parent_station": get_s('parent_station'),
                        "platform_code": get_s('platform_code')
                    }
                })
                
    if not features:
        return None
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

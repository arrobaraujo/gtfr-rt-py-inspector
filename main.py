"""
FastAPI application for GTFS-RT Py Inspector.

Provides REST endpoints and static file serving for the web interface.
Endpoints are organized as: settings, data ingestion, real-time query, and UI.
"""

import os
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from gtfs_processor import get_trip_shape, process_rt_data, state

# ---------------------------------------------------------------------------
# Application Setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GTFS-RT Inspector",
    description="Real-time GTFS feed inspector with static data enrichment.",
    version="1.0.0",
)

# Ensure static asset directories exist
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class SettingsModel(BaseModel):
    """Payload for updating GTFS-RT feed URLs."""

    vehicle_positions: str = ""
    trip_updates: str = ""
    alerts: str = ""


class NetworkModel(BaseModel):
    """Payload for adding/updating a network preset."""
    name: str
    vehicle_positions: str = ""
    trip_updates: str = ""
    alerts: str = ""


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/rt")
def get_rt():
    """
    Retrieve processed GTFS-RT data (Vehicles, Alerts, Trip Updates).

    Fetches live Protobufs and merges them with any static GTFS data
    that has been previously uploaded.
    """
    return JSONResponse(content=process_rt_data())


@app.get("/api/settings")
def get_settings():
    """Return the currently configured GTFS-RT feed URLs."""
    return JSONResponse(content=state.rt_urls)


@app.post("/api/settings")
def update_settings(settings: SettingsModel):
    """Update one or more GTFS-RT feed URLs at runtime."""
    state.set_urls(
        settings.vehicle_positions,
        settings.trip_updates,
        settings.alerts,
    )
    return JSONResponse(content={
        "status": "success",
        "urls": state.rt_urls,
    })


@app.get("/api/networks")
def list_networks():
    """Return all saved network presets."""
    return JSONResponse(content=state.networks)


@app.post("/api/networks")
def save_network(network: NetworkModel):
    """Save a new network preset."""
    state.add_network(
        network.name,
        network.vehicle_positions,
        network.trip_updates,
        network.alerts,
    )
    return JSONResponse(content={"status": "success"})


@app.delete("/api/networks/{name}")
def delete_network(name: str):
    """Delete a network preset by name."""
    if state.delete_network(name):
        return JSONResponse(content={"status": "success"})
    return JSONResponse(status_code=404, content={"status": "error", "message": "Network mapping not found"})


@app.get("/api/export")
def export_data(format: str = Query("json")):
    """
    Export current real-time data to JSON or XLSX.
    """
    data = process_rt_data()
    if format == "csv":
        # Exporting only vehicles for now as CSV is a single sheet format
        if not data["vehicles"]:
            return JSONResponse(status_code=404, content={"message": "No vehicle data to export"})
        
        v_df = pd.DataFrame(data["vehicles"])
        csv_data = v_df.to_csv(index=False, sep=";", encoding="utf-8-sig")
        
        return StreamingResponse(
            io.BytesIO(csv_data.encode("utf-8-sig")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=gtfs_vehicles.csv"}
        )

    return JSONResponse(content=data)


@app.post("/api/upload-gtfs")
async def upload_gtfs(file: UploadFile = File(...)):
    """
    Accept a ``gtfs.zip`` upload, parse it with Pandas, and store the
    resulting DataFrames in the application state for enrichment queries.
    """
    try:
        contents = await file.read()
        result = state.load_static_zip(contents)
        return JSONResponse(content=result)
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal error processing GTFS file."},
        )


@app.get("/api/trip-shape/{trip_id}")
def trip_shape(trip_id: str):
    """
    Return a GeoJSON FeatureCollection for the requested *trip_id*,
    containing the LineString geometry and associated stop Point markers.
    """
    shape = get_trip_shape(trip_id)
    if not shape:
        return JSONResponse(
            status_code=404,
            content={"message": "Shape not found or Static GTFS not loaded"},
        )
    return JSONResponse(content=shape)


# ---------------------------------------------------------------------------
# Static Files & UI
# ---------------------------------------------------------------------------

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def serve_index():
    """Serve the main single-page web interface."""
    return FileResponse("static/index.html")


# ---------------------------------------------------------------------------
# Development Server
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

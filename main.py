"""
FastAPI application for GTFS-RT Py Inspector.
Provides REST endpoints and static file serving for the web interface.
"""
from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import os

from gtfs_processor import state, process_rt_data, get_trip_shape

app = FastAPI(title="GTFS-RT Inspector")

# Assure static directory exists
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)

class SettingsModel(BaseModel):
    """Data model for GTFS-RT feed API Links."""
    vehicle_positions: str = ""
    trip_updates: str = ""
    alerts: str = ""

@app.get("/api/rt")
def get_rt():
    """
    Retrieve processed GTFS-RT info (Vehicles, Alerts).
    Fetches online Protobufs and merges with static GTFS data.
    """
    data = process_rt_data()
    return JSONResponse(content=data)

@app.get("/api/settings")
def get_settings():
    """Returns the currently active GTFS-RT feed URLs."""
    return JSONResponse(content=state.rt_urls)

@app.post("/api/settings")
def update_settings(settings: SettingsModel):
    """Updates the target GTFS-RT Feed URLs dynamically."""
    state.set_urls(settings.vehicle_positions, settings.trip_updates, settings.alerts)
    return JSONResponse(content={
        "status": "success", 
        "message": "Links updated successfully / atualizados com sucesso", 
        "urls": state.rt_urls
    })

@app.post("/api/upload-gtfs")
async def upload_gtfs(file: UploadFile = File(...)):
    """
    Receives a standard gtfs.zip file from the client, reads it into memory via pandas,
    and updates the application state with static routes, trips, shapes, and fares.
    """
    contents = await file.read()
    result = state.load_static_zip(contents)
    return JSONResponse(content=result)

@app.get("/api/trip-shape/{trip_id}")
def trip_shape(trip_id: str):
    """
    Returns the GeoJSON FeatureCollection corresponding to the requested trip_id,
    including the LineString geometry and associated Point markers (Stops).
    """
    shape = get_trip_shape(trip_id)
    if not shape:
        return JSONResponse(status_code=404, content={"message": "Shape not found or Static GTFS not loaded"})
    return JSONResponse(content=shape)

# Serve static files for frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_index():
    """Returns the main interactive web interface."""
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

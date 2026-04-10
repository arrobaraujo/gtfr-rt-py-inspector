# GTFS-RT Python Inspector

A high-performance, real-time geographic visualization tool for monitoring public transit fleets. It consumes GTFS-Realtime (GTFS-RT) feeds and overlays them on a dynamic Leaflet map, enriching real-time positions with static GTFS data (like fares, routes, shapes, and localized stops). 

This application uses **FastAPI** on the backend and an **HTML/Vanilla JS/CSS** stack on the frontend to deliver a smooth, Glassmorphism-style "Premium" user interface. No bulky frontend frameworks, just clean and optimized rendering.

## Core Features

- **Live Vehicle Tracking:** Pulls GTFS-RT Protocol Buffers dynamically and aligns vehicle markers over the map using real-time coordinates and rotation (`bearing`).
- **Static GTFS Merging:** Upload a traditional `gtfs.zip` through the interface to automatically cross-reference data in memory (via `pandas`), displaying real-time data enriched with route names, destinations, line descriptions, and fares.
- **Dynamic Shapes & Geometry:** Click on a vehicle to plot the exact `<LineString>` geometry corresponding to its trip (if provided in your GTFS).
- **Interactive Line Stops:** Toggle line stops to view all mapped points along the selected trip's route, complete with station codes and platform metadata.
- **Dark/Light Mode Maps:** Seamlessly toggle between CARTO Dark Matter and Positron base maps without losing map state.
- **Multilingual Support:** The interface is fully internationalized natively in JavaScript, actively supporting English, Portuguese, and Spanish toggles.

## Prerequisites

- **Python 3.9+** (To manage dependencies easily, it's recommended to use virtual environments).

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/arrobaraujo/gtfs-rt-py-inspector.git
   cd gtfs-rt-py-inspector
   ```

2. **Set up the Virtual Environment & Install Dependencies:**
   A convenience script `start.bat` is included for Windows users to automatically create the environment, install dependencies from `requirements.txt`, and boot the server in a single click. Or you can run:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # (On Windows use .venv\Scripts\activate)
   pip install -r requirements.txt
   ```

## Usage

### Option A: Standard Python (Windows / Linux / Mac)
1. Start the backend Web Server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *Windows users can simply double-click `start.bat`.*

### Option B: Docker (Recommended for GitHub Users)
You can run the entire service without installing Python natively:
```bash
docker build -t gtfs-inspector .
docker run -p 8000:8000 gtfs-inspector
```
Or, if you use Docker Compose:
```bash
docker-compose up --build
```

### Accessing the Interface
2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

3. **Configure Feeds:** Use the sidebar to enter your API Access URLs for GTFS-RT feeds (`vehicle_positions`, `trip_updates`, `alerts`).
4. **Enriching with Static Data:** Upload your region's `gtfs.zip` via the *Upload GTFS Static* section. The backend will parse it using `UTF-8-SIG` to respect BOM encodings typically found in governmental transit exports, seamlessly merging `route_id`, `fare_id`, and `shape_id` schemas.

## Code Architecture

- `main.py`: Contains the FastAPI application, serving dynamic REST endpoints and HTML assets.
- `gtfs_processor.py`: Encapsulates the GTFS parsing logic. It unzips and converts static data into Pandas DataFrames, and utilizes `gtfs-realtime-bindings` to unpack Protobuf feeds, merging them efficiently.
- `static/js/app.js`: Connects to backend REST endpoints, mapping entities to the Leaflet map and interpolating missing values (`N/A`) elegantly.
- `static/js/i18n.js`: Controls language translation mapping.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

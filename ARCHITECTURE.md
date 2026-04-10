# Project Architecture

This document provides a deep technical dive into the structure, data flow, and design principles of the **GTFS-RT Python Inspector**.

## 🏗 High-Level Design

The system is architected as a decoupled **Single Page Application (SPA)** that communicates with a **FastAPI** backend. 

### Core Components
1. **Frontend (Map Discovery Layer)**: Built with Leaflet.js, vanilla JavaScript, and CSS. It handles all geospatial rendering, polling logic, and stateful UI transitions.
2. **Backend (Data Ingestion/Enrichment Layer)**: A Python service that manages feed fetching, Protobuf parsing, and in-memory static GTFS reconciliation using Pandas.

## 📡 Backend Architecture

### State Management (`gtfs_processor.py`)
The backend maintains a global `GTFSState` singleton. This avoids the overhead of a database for medium-sized transit datasets (typically < 100MB static GTFS).
- **Static Storage**: Data is stored as an in-memory dictionary of DataFrames (`routes`, `trips`, `stops`, etc.).
- **UTF-8-SIG Handling**: Automatic stripping of the Byte Order Mark (BOM) sequence during CSV parsing to ensure column names like `route_id` are correctly indexed across different transit provider exports.

### Real-Time Pipeline (`process_rt_data`)
1. **Fetch**: Simultaneous download of Vehicle Positions, Trip Updates, and Service Alerts feeds.
2. **Standardization**: Values from multiple feed entities are normalized into a unified vehicle object.
3. **Enrichment**: The system performs a reverse lookup on the static DataFrames based on `route_id` and `trip_id`:
    - **Fares**: Calculated by joining `fare_rules` with `fare_attributes`.
    - **Geometries**: Resolved via `shapes` and `trips` cross-referencing.
4. **Serialization**: Data is delivered to the frontend as a JSON payload for efficiency.

### API Endpoints (`main.py`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rt` | `GET` | Main telemetry endpoint returning vehicles, alerts, and trip updates. |
| `/api/networks` | `GET/POST/DELETE` | CRUD operations for feed preset management (persisted in `networks.json`). |
| `/api/upload-gtfs` | `POST` | In-memory ZIP processor for static GTFS files. |
| `/api/trip-shape/{id}` | `GET` | Returns a GeoJSON FeatureCollection including shape lines and associated stops. |

## 🎨 Frontend Architecture

### UI Controller (`app.js`)
The application follows a **Reactivity Loop**:
- **Polling Logic**: High-performance polling with a default 30s interval. 
- **Immediate Refresh**: A critical handler triggers an immediate `pollData` cycle upon successful GTFS upload, ensuring the UI populates metadata without latency.
- **Marker In-Place Updates**: Markers are cached in a `vehicleMarkers` map. Instead of clearing the map on every poll, existing markers are updated via `setLatLng` and `setRotationAngle` to prevent visual flickering.

### Visualization & Interaction
- **Accordion System**: A pure CSS/JS hybrid using the `.collapsed` state to manage sidebar density.
- **Enhanced Data Inspector**: A tabbed overlay (`Vehicles`, `Trip Updates`, `Alerts`) that formats and highlights raw JSON fields for developers and field engineers.
- **Reactive Filters**: Checkbox listeners trigger instantaneous `updateMap` calls using the `lastVehicles` local cache for sub-millisecond responsiveness.

### Localization (`i18n.js`)
Uses a `data-i18n` attribute system. The engine resolves keys from localized dictionaries and updates the DOM in a single pass. Supports localized placeholders and technical popup labels.

## 🛠 Project Design Decisions

| Choice | Rationale |
|--------|-----------|
| **No Virtual DOM** | Leaflet directly manages map state; adding a VDOM layer (like React/Vue) would add unnecessary overhead for a purely map-centric application. |
| **In-Memory Pandas Processing** | Allows for extremely fast joins between real-time and static data compared to SQLite/File-based processing. |
| **CartoDB Base Maps** | Selected for high-contrast visibility and reliable global availability. |
| **Marker Rotation** | Implementing rotation on the frontend via `leaflet-rotatedmarker` enables directional arrows derived from the GTFS-RT `bearing` field. |

## 🚢 Deployment & Environment

- **Dockerized**: The project includes a `Dockerfile` and `docker-compose.yml` for reproducible environments.
- **Windows Workflow**: A `start.bat` script is provided to abstract Python environment management (pip/venv) for non-developer users.

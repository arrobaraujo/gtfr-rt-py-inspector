# Architecture

This document describes the internal architecture of GTFS-RT Python Inspector, aiming to help contributors and maintainers understand how the system is structured, how data flows through it, and why specific design choices were made.

## High-Level Overview

```
┌─────────────────────┐         ┌────────────────────────────┐
│   Browser Client    │◄───────►│   FastAPI Backend (Python) │
│  (Vanilla JS + CSS) │  HTTP   │   main.py + uvicorn        │
└─────────────────────┘         └────────────┬───────────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │    gtfs_processor.py         │
                              │  ┌────────────┐ ┌─────────┐ │
                              │  │  Static    │ │ RT Feed │ │
                              │  │  GTFS      │ │ Parser  │ │
                              │  │  (Pandas)  │ │ (Proto) │ │
                              │  └────────────┘ └─────────┘ │
                              └──────────────────────────────┘
```

The application follows a simple **two-layer** model:

1. **Backend (Python/FastAPI):** Serves static files, exposes REST API endpoints, fetches and parses GTFS-Realtime Protocol Buffers, and merges them with static GTFS data held in memory.
2. **Frontend (HTML/JS/CSS):** A single-page application that renders a Leaflet map, polls the backend at configurable intervals, and presents all data through an interactive sidebar.

## Backend

### `main.py` — Application Entry Point

FastAPI application that defines the following endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Serves the main `index.html` interface |
| `GET` | `/api/rt` | Returns merged real-time + static vehicle data |
| `GET` | `/api/settings` | Returns the current GTFS-RT feed URLs |
| `POST` | `/api/settings` | Updates GTFS-RT feed URLs at runtime |
| `POST` | `/api/upload-gtfs` | Accepts a `gtfs.zip`, parses it into memory |
| `GET` | `/api/trip-shape/{trip_id}` | Returns GeoJSON geometry for a specific trip |

Static files are mounted via `StaticFiles` middleware under `/static`.

### `gtfs_processor.py` — Core Data Engine

This module manages all data logic through two main constructs:

#### `GTFSState` class

A singleton-style state container that holds:

- **`rt_urls`**: Dictionary of live GTFS-RT feed URLs (vehicle positions, trip updates, alerts). Defaults to empty strings — URLs are configured at runtime via the UI.
- **`static_data`**: Dictionary of Pandas DataFrames parsed from an uploaded `gtfs.zip`. Supports: `routes`, `trips`, `shapes`, `stops`, `stop_times`, `fare_attributes`, `fare_rules`.

Key methods:
- `set_urls(vp, tu, alerts)` — Updates feed endpoints dynamically.
- `load_static_zip(content: bytes)` — Reads a ZIP from memory, parses CSV files with `UTF-8-SIG` encoding (to handle Windows BOM), and stores them as DataFrames. Uses a constant `GTFS_STATIC_FILES` list for DRY iteration.

#### Helper Functions

- **`_safe_str(df, row_idx, col)`** — Safely extracts a string from a DataFrame cell, handling NaN and whitespace.
- **`_enrich_vehicle(route_id, trip_id, ...)`** — Isolated enrichment logic that looks up route, fare, and trip metadata from the static DataFrames. Returns a dict ready to be merged into the vehicle payload.
- **`fetch_feed(url)`** — Downloads and parses a GTFS-RT Protobuf. Returns `None` on failure or empty URL.

#### `process_rt_data()` function

1. Fetches each configured Protobuf feed via `requests`.
2. Iterates over `FeedEntity` objects.
3. For each vehicle position entity, looks up enrichment data in the static DataFrames:
   - **Route info:** `route_short_name`, `route_long_name`, `route_desc`, `route_color`
   - **Trip info:** `trip_headsign`, `direction_id`
   - **Fare info:** `fare_price`, `fare_currency` (via `fare_rules` → `fare_attributes` join)
4. Returns a JSON-serializable dictionary with `vehicles` and `alerts` arrays.

#### `get_trip_shape(trip_id)` function

1. Looks up the `shape_id` for the given `trip_id` in the trips DataFrame.
2. Builds a GeoJSON `FeatureCollection` containing:
   - A `LineString` feature from the shapes DataFrame.
   - `Point` features for each stop along the trip (from `stop_times` joined with `stops`).

### Data Flow Diagram

```
GTFS-RT Protobuf Feeds              Static GTFS ZIP (uploaded once)
        │                                      │
        ▼                                      ▼
   fetch_feed(url)                    load_static_zip(bytes)
        │                                      │
        ▼                                      ▼
  gtfs_realtime_pb2                     pandas DataFrames
   FeedMessage                        (routes, trips, shapes,
        │                              stops, stop_times, fares)
        │                                      │
        └──────────────┬───────────────────────┘
                       ▼
              process_rt_data()
              Merge RT + Static
                       │
                       ▼
              JSON Response → /api/rt
```

## Frontend

### File Structure

```
static/
├── index.html          # Main SPA shell
├── css/
│   └── style.css       # Glassmorphism design system
└── js/
    ├── app.js          # Core application logic
    └── i18n.js         # Internationalization engine
```

### `app.js` — Application Controller

Responsibilities:

- **Map initialization:** Creates a Leaflet map with CARTO Dark Matter tiles (toggleable to Light).
- **Polling loop:** Fetches `/api/rt` at a user-configurable interval (default 30s, range 2–300s).
- **Marker management:** Uses a `Map<id, marker>` structure to update existing markers in-place (position + rotation) rather than recreating them, avoiding flicker.
- **Popup generation:** `createPopupContent(vehicle)` builds rich HTML popups with all available vehicle metadata, using `t(key)` for i18n string resolution.
- **Shape rendering:** On marker click, fetches `/api/trip-shape/{trip_id}` and draws a GeoJSON polyline + stop markers on the map.
- **Focus mode:** When enabled, hides all markers except the selected vehicle.
- **Raw data view:** Toggles between map and a full JSON dump of the API response for debugging.
- **Speed unit toggle:** Supports both m/s → km/h conversion and raw km/h passthrough, configurable via checkbox.

### `i18n.js` — Internationalization

A lightweight, framework-free translation system:

- **Translation dictionaries:** Three objects (`pt`, `en`, `es`) mapping keys to localized strings.
- **`setLanguage(lang)`:** Iterates over all DOM elements with `data-i18n` attributes, replacing their `textContent` with the appropriate translation.
- **`t(key)`:** Returns the translated string for the current language; used for dynamic content in JavaScript (popups, status messages).

### `style.css` — Design System

Built on CSS custom properties (variables) for consistent theming:

- Dark-mode first with `--bg-dark`, `--bg-panel`, `--accent` tokens.
- Glassmorphism effects via `backdrop-filter: blur()`.
- Responsive sidebar with scrollable overflow.
- Custom-styled Leaflet popup overrides matching the dark theme.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No frontend framework** | Reduces bundle size and complexity; the app is a single view with straightforward DOM updates |
| **In-memory static data** | Avoids database dependencies; a single GTFS ZIP is small enough to fit in RAM as DataFrames |
| **UTF-8-SIG parsing** | Many government transit agencies export CSVs with BOM markers; this prevents column-name corruption |
| **Configurable speed units** | GTFS-RT spec defines speed in m/s, but some providers send km/h; the toggle avoids wrong calculations |
| **Raw JSON debug view** | Essential for field engineers verifying feed quality without external tools |

## Docker Support

The `Dockerfile` uses `python:3.9-slim` as its base, installs dependencies from `requirements.txt`, and runs `uvicorn` directly. The `docker-compose.yml` provides a one-command startup with volume mounting for development.

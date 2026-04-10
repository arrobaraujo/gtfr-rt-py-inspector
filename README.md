# GTFS-RT Python Inspector

A high-performance, real-time geographic visualization tool for monitoring public transit fleets. It consumes GTFS-Realtime (GTFS-RT) feeds and overlays them on a dynamic Leaflet map, enriching real-time positions with technical metadata from static GTFS files (routes, trips, shapes, stops, and fares).

This application utilizes **FastAPI** on the backend and an **HTML/Vanilla JS/CSS** stack on the frontend to deliver a premium, high-speed user interface with zero reliance on heavy frontend frameworks.

## 🚀 Key Features

### 📡 Real-Time Monitoring
- **Live Vehicle Positions**: Automatically pulls Protobuf feeds and maps vehicles with real-time movement and orientation (`bearing`).
- **Protocol Buffer Support**: Native parsing of `FeedMessage` entities for Vehicles, Trip Updates, and Service Alerts.
- **Immediate Enrichment**: Merges real-time data with static GTFS metadata instantly upon upload—no more delays in identifying vehicles.

### 📊 Rich Metadata & Inspection
- **Technical Popups**: Detailed vehicle popups including **Trip ID**, **Direction ID**, **Speed (km/h)**, **Start Time**, and **Fare/Price** info.
- **Static Alignment**: Correlates RT data with `routes.txt`, `trips.txt`, and `fare_attributes.txt`.
- **Enhanced Stop Markers**: View stop levels with specialized popups for **Stop ID**, **Stop Code**, **Zone ID**, and **Parent Station**.
- **Geometry Visualization**: Plots exact trip shapes (`shapes.txt`) on marker click for precise alignment verification.

### 🎨 Premium UI/UX
- **Glassmorphism Design**: A sleek, translucent, dark-themed dashboard built with modern CSS.
- **Accordion Sidebar**: Collapsible sections for space management, allowing focus on specific monitoring tools.
- **Flag-Based Localization**: Custom language selector supporting **English (GB)**, **Portuguese (BR)**, and **Spanish (ES)** with real-time interface translation.
- **Advanced Raw Data Explorer**: A specialized overlay with **Categorized Tabs** (Vehicles | Trip Updates | Alerts) for deep JSON debugging.

## 🛠 Prerequisites

- **Python 3.9+**
- A modern web browser (Chrome, Firefox, or Edge recommended)
- GTFS-Realtime Protobuf feed URLs (VP, TU, and Alerts)

## 📦 Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/arrobaraujo/gtfs-rt-py-inspector.git
   cd gtfs-rt-py-inspector
   ```

2. **Setup and Run (One-Click for Windows)**:
   Simply double-click `start.bat`. It will create a `.venv`, install dependencies, and start the server.

3. **Manual Setup**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # (.venv\Scripts\activate on Windows)
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## 🐳 Docker Support

Run the inspector in a containerized environment (optional):
```bash
docker-compose up --build
```
The app will be available at `http://localhost:8000`.

## 📖 Usage Guide

1. **Configuration**: Use the sidebar to set your GTFS-RT feed URLs. You can save these as **Source Presets** for quick loading between different regions or agencies.
2. **Static Data**: Upload a standard `gtfs.zip`. The backend handles `UTF-8-SIG` (BOM) stripping automatically to ensure compatibility with various transit agency exports.
3. **Map Controls**: Toggle "Fundo do Mapa Claro" for daylight visibility or "Ocultar outros" to focus on a single vehicle's path.
4. **Export**: Download processed data in **JSON** or **CSV** (optimized for spreadsheet analysis) formats via the Export section.

## 🔗 Test Feeds & Examples

Looking for data to test? Here are some public feeds compatible with the inspector:

- **Belo Horizonte, Brazil (PBH)**: [Static GTFS](https://dados.pbh.gov.br/dataset/gtfs) / [GTFS-RT PBH](https://dados.pbh.gov.br/dataset/gtfs-rt)
- **Metro Bilbao, Spain**: [Static GTFS](https://mobilitydatabase.org/feeds/gtfs/mdb-3052) / [GTFS-RT](https://mobilitydatabase.org/feeds/gtfs_rt/mdb-3058)

## ⚖️ License

Distributed under the **GNU General Public License v3.0**. See `LICENSE` for more information.

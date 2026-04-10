/**
 * GTFS-RT Inspector — Main Application Controller
 * RESTORED & ROBUST VERSION
 */

// ---------------------------------------------------------------------------
// 1. Map Initialization (IMMEDIATE)
// ---------------------------------------------------------------------------

const map = L.map("map").setView([-22.9068, -43.1729], 12);

// Use the reliable CartoDB Dark tiles that worked before
let currentTileLayer = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
        attribution: '&copy; OSM &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }
).addTo(map);

const markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: "marker-cluster marker-cluster-small",
            iconSize: L.point(40, 40)
        });
    }
}).addTo(map);

// ---------------------------------------------------------------------------
// 2. State
// ---------------------------------------------------------------------------

let isFirstLoad = true;
let vehicleMarkers = {};
let currentShapeLayer = null;
let currentSelectedVehicle = null;
let lastVehicles = [];
let lastRawData = null;
let pollIntervalId = null;
let currentRawTab = "vehicles";

// ---------------------------------------------------------------------------
// 3. Helper Functions
// ---------------------------------------------------------------------------

const t = (key) => {
    const lang = translations[window.currentLang] || translations['pt'];
    return lang[key] || key;
};

function getBusIcon(colorHex) {
    const color = colorHex ? "#" + colorHex : "#3b82f6";
    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 19V5M12 5l-7 7M12 5l7 7"/>
                </svg>
               </div>`,
        className: "bus-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
}

// ---------------------------------------------------------------------------
// 4. Core Logic
// ---------------------------------------------------------------------------

async function pollData() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.classList.remove("hidden");
    
    try {
        const res = await fetch("/api/rt");
        const data = await res.json();
        lastRawData = data;
        lastVehicles = data.vehicles;
        
        updateMap(data.vehicles);
        updateAlerts(data.alerts);
        
        document.getElementById("metrics-vehicles").innerText = data.vehicles.length;
        document.getElementById("metrics-alerts").innerText = data.alerts.length;
    } catch (e) {
        console.error("Poll error:", e);
    } finally {
        if (overlay) overlay.classList.add("hidden");
        // Update raw view live if open
        if (!document.getElementById("raw-data-overlay").classList.contains("hidden")) {
            updateRawView();
        }
    }
}

function updateMap(vehicles) {
    const currentIds = new Set();
    const bounds = L.latLngBounds();
    const shouldFocus = document.getElementById("chk-focus").checked && currentSelectedVehicle;
    const focusedId = shouldFocus ? (currentSelectedVehicle.vehicle_id || currentSelectedVehicle.id) : null;

    const fVid = document.getElementById("filter-vid").value.toLowerCase().trim();
    const fTid = document.getElementById("filter-tid").value.toLowerCase().trim();
    const fRid = document.getElementById("filter-rid").value.toLowerCase().trim();
    const fRsn = document.getElementById("filter-rsn").value.toLowerCase().trim();
    const fRln = document.getElementById("filter-rln").value.toLowerCase().trim();

    vehicles.forEach(v => {
        const vId = v.vehicle_id || v.id;
        if (shouldFocus && vId !== focusedId) return;

        // Filtering
        if (fVid && !vId.toLowerCase().includes(fVid)) return;
        if (fTid && !(v.trip_id || "").toLowerCase().includes(fTid)) return;
        if (fRid && !(v.route_id || "").toLowerCase().includes(fRid)) return;
        if (fRsn && !(v.route_short_name || "").toLowerCase().includes(fRsn)) return;
        if (fRln && !(v.route_long_name || "").toLowerCase().includes(fRln)) return;

        currentIds.add(vId);
        const latlng = [v.lat, v.lon];

        if (!vehicleMarkers[vId]) {
            const m = L.marker(latlng, {
                icon: getBusIcon(v.route_color),
                rotationAngle: v.bearing || 0,
                rotationOrigin: "center center"
            });
            m.bindPopup(() => createPopupContent(v));
            m.on("click", () => handleMarkerClick(v));
            vehicleMarkers[vId] = m;
            markerCluster.addLayer(m);
        } else {
            const m = vehicleMarkers[vId];
            m.setLatLng(latlng);
            if (m.setRotationAngle) m.setRotationAngle(v.bearing || 0);
            m.setPopupContent(createPopupContent(v));
        }
        if (isFirstLoad) bounds.extend(latlng);
    });

    for (const id in vehicleMarkers) {
        if (!currentIds.has(id)) {
            markerCluster.removeLayer(vehicleMarkers[id]);
            delete vehicleMarkers[id];
        }
    }

    if (isFirstLoad && vehicles.length > 0 && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
        isFirstLoad = false;
    }
}

async function handleMarkerClick(vehicle) {
    currentSelectedVehicle = vehicle;
    if (!vehicle.trip_id) return;
    
    try {
        const res = await fetch(`/api/trip-shape/${vehicle.trip_id}`);
        if (res.status === 200) {
            const data = await res.json();
            if (currentShapeLayer) map.removeLayer(currentShapeLayer);
            
            const showStops = document.getElementById("chk-stops").checked;
            currentShapeLayer = L.geoJSON(data, {
                style: { color: vehicle.route_color ? "#" + vehicle.route_color : "#3b82f6", weight: 5, opacity: 0.7 },
                filter: (feature) => feature.properties.type === "stop" ? showStops : true,
                pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
                    radius: 7, fillColor: "white", color: vehicle.route_color ? "#" + vehicle.route_color : "#3b82f6", weight: 2, fillOpacity: 1
                }),
                onEachFeature: (feature, layer) => {
                    if (feature.properties.type === "stop") {
                        layer.bindPopup(`
                            <div class="popup-content">
                                <h3 style="margin:0 0 8px 0; color:#3b82f6;">${feature.properties.stop_name}</h3>
                                <p><strong>${t("popup_stop_id")}:</strong> ${feature.properties.stop_id}</p>
                                <p><strong>${t("popup_stop_code")}:</strong> ${feature.properties.stop_code || t("na")}</p>
                                <p><strong>${t("popup_zone_id")}:</strong> ${feature.properties.zone_id || t("na")}</p>
                                <p><strong>${t("popup_loc_type")}:</strong> ${feature.properties.location_type || "0"}</p>
                                <p><strong>${t("popup_platform")}:</strong> ${feature.properties.platform_code || t("na")}</p>
                                <p><strong>${t("popup_parent")}:</strong> ${feature.properties.parent_station || t("na")}</p>
                                <p><strong>Desc:</strong> ${feature.properties.stop_desc || ""}</p>
                            </div>
                        `);
                    } else if (feature.properties.type === "shape") {
                        layer.bindPopup(`<b>${vehicle.route_short_name || ""} - ${vehicle.trip_headsign || ""}</b>`);
                    }
                }
            }).addTo(map);
        }
    } catch (e) {}
}

function createPopupContent(v) {
    const isKmh = document.getElementById("chk-speed-kmh").checked;
    const speed = isKmh ? (v.speed || 0) : ((v.speed || 0) * 3.6);
    const direction = v.direction_id !== "" ? t("dir_" + v.direction_id) : t("na");
    const fare = v.fare_price ? `${v.fare_price} ${v.fare_currency || "BRL"}` : t("na");
    
    return `
        <div class="popup-content">
            <h3 style="margin:0 0 8px 0; color:#3b82f6;">${t("popup_vehicle")}: ${v.vehicle_id || v.id}</h3>
            <p><strong>${t("popup_trip")}:</strong> ${v.trip_id || t("na")}</p>
            <p><strong>${t("popup_route")}:</strong> ${v.route_short_name || v.route_id || t("na")}</p>
            <p><strong>${t("popup_route_name")}:</strong> ${v.route_long_name || t("na")}</p>
            <p><strong>${t("popup_direction")}:</strong> ${direction}</p>
            <p><strong>${t("popup_speed")}:</strong> ${Math.round(speed)} km/h</p>
            <p><strong>${t("popup_start_time")}:</strong> ${v.start_time || t("na")}</p>
            <p><strong>${t("popup_fare")}:</strong> ${fare}</p>
            <p><strong>${t("popup_last_update")}:</strong> ${new Date(v.timestamp * 1000).toLocaleTimeString()}</p>
        </div>
    `;
}

function updateAlerts(alerts) {
    const container = document.getElementById("alerts-container");
    if (alerts.length === 0) {
        container.innerHTML = `<p class="empty-state">${t("alerts_empty")}</p>`;
        return;
    }
    container.innerHTML = alerts.map(a => `
        <div class="alert-item" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 8px;">
            <h4 style="margin: 0 0 4px 0; font-size: 0.875rem;">${a.header || t("na")}</h4>
            <p style="margin: 0; font-size: 0.75rem; color: #94a3b8;">${a.description || ""}</p>
        </div>
    `).join("");
}

// ---------------------------------------------------------------------------
// 5. Global UI Handlers
// ---------------------------------------------------------------------------

window.changeLanguage = (lang, country) => {
    setLanguage(lang);
    document.getElementById("current-flag").src = `https://flagcdn.com/w20/${country}.png`;
    document.getElementById("current-lang-label").textContent = lang.toUpperCase();
    document.getElementById("lang-options").classList.add("hidden");
};

window.applyFilters = () => updateMap(lastVehicles);

window.clearFilters = () => {
    ["filter-vid", "filter-tid", "filter-rid", "filter-rsn", "filter-rln"].forEach(id => document.getElementById(id).value = "");
    applyFilters();
};

window.exportData = (fmt) => window.open(`/api/export?format=${fmt}`, "_blank");

window.switchRawTab = (tab) => {
    currentRawTab = tab;
    document.querySelectorAll(".raw-tab").forEach(b => b.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");
    updateRawView();
};

window.updateRawView = () => {
    if (!lastRawData) return;
    const container = document.getElementById("raw-content");
    const dataDisplay = lastRawData[currentRawTab] || lastRawData;
    container.innerText = JSON.stringify(dataDisplay, null, 2);
};

window.closeRawData = () => {
    document.getElementById("raw-data-overlay").classList.add("hidden");
    document.getElementById("map").style.visibility = "visible";
    document.getElementById("chk-raw-data").checked = false;
    setTimeout(() => map.invalidateSize(), 150);
};

window.zoomToAll = () => {
    const b = markerCluster.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [50, 50] });
};

window.saveSettings = async () => {
    const p = {
        vehicle_positions: document.getElementById("link-vp").value,
        trip_updates: document.getElementById("link-tu").value,
        alerts: document.getElementById("link-a").value
    };
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    const sec = parseInt(document.getElementById("sync-interval").value) || 30;
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(pollData, sec * 1000);
    
    const msg = document.getElementById("settings-status");
    msg.textContent = t("msg_settings_saved");
    msg.className = "status-msg success";
    setTimeout(() => msg.textContent = "", 3000);
    isFirstLoad = true; pollData();
};

window.uploadGTFS = async () => {
    const f = document.getElementById("gtfs-upload").files[0];
    if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    const msg = document.getElementById("upload-status");
    msg.textContent = t("msg_uploading");
    
    try {
        const res = await fetch("/api/upload-gtfs", { method: "POST", body: fd });
        const d = await res.json();
        msg.textContent = d.status === "success" ? t("msg_gtfs_success") : d.message;
        msg.className = "status-msg " + d.status;
        if (d.status === "success") {
            pollData(); // Instant enrichment
        }
    } catch (e) { msg.textContent = "Error"; }
};

// Source Management (Presets)
window.loadPresets = async () => {
    const res = await fetch("/api/networks");
    const data = await res.json();
    const sel = document.getElementById("source-selector");
    sel.innerHTML = `<option value="">${t("source_select_default")}</option>`;
    for (const n in data) { const o = document.createElement("option"); o.value = n; o.textContent = n; sel.appendChild(o); }
};

window.loadPreset = (n) => {
    if (!n) return;
    fetch("/api/networks").then(r => r.json()).then(d => {
        const p = d[n];
        if (p) {
            document.getElementById("link-vp").value = p.vehicle_positions || "";
            document.getElementById("link-tu").value = p.trip_updates || "";
            document.getElementById("link-a").value = p.alerts || "";
            saveSettings();
        }
    });
};

window.showAddSourceModal = () => document.getElementById("source-modal").classList.remove("hidden");
window.closeSourceModal = () => document.getElementById("source-modal").classList.add("hidden");
window.savePreset = async () => {
    const n = document.getElementById("modal-source-name").value.trim();
    if (!n) return;
    const p = {
        name: n,
        vehicle_positions: document.getElementById("link-vp").value,
        trip_updates: document.getElementById("link-tu").value,
        alerts: document.getElementById("link-a").value
    };
    await fetch("/api/networks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    closeSourceModal(); await loadPresets();
    document.getElementById("source-selector").value = n;
};

window.confirmDeleteSource = async () => {
    const n = document.getElementById("source-selector").value;
    if (n && confirm(t("msg_delete_confirm"))) {
        await fetch(`/api/networks/${n}`, { method: "DELETE" });
        await loadPresets();
    }
};

// ---------------------------------------------------------------------------
// 6. Bootstrap
// ---------------------------------------------------------------------------

// Event listeners for visuals
document.getElementById("chk-light-map").addEventListener("change", (e) => {
    if (currentTileLayer) map.removeLayer(currentTileLayer);
    const url = e.target.checked 
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    currentTileLayer = L.tileLayer(url, { attribution: '&copy; CARTO', subdomains: 'abcd' }).addTo(map);
});

document.getElementById("chk-focus").addEventListener("change", () => applyFilters());
document.getElementById("chk-stops").addEventListener("change", () => {
    if (currentSelectedVehicle) handleMarkerClick(currentSelectedVehicle);
});
document.getElementById("chk-speed-kmh").addEventListener("change", () => updateMap(lastVehicles));

document.getElementById("chk-raw-data").addEventListener("change", (e) => {
    const m = document.getElementById("map");
    const r = document.getElementById("raw-data-overlay");
    if (e.target.checked) { 
        m.style.visibility = "hidden"; 
        r.classList.remove("hidden");
        updateRawView();
    }
    else { 
        r.classList.add("hidden");
        m.style.visibility = "visible"; 
        setTimeout(() => map.invalidateSize(), 150); 
    }
});

document.getElementById("lang-trigger").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("lang-options").classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    if (!document.getElementById("lang-dropdown").contains(e.target)) {
        document.getElementById("lang-options").classList.add("hidden");
    }
});

// Collapsible Sections
document.querySelectorAll(".sidebar-section h2").forEach(header => {
    header.addEventListener("click", (e) => {
        // Don't toggle if clicking the info icon
        if (e.target.classList.contains("info-icon")) return;
        header.parentElement.classList.toggle("collapsed");
    });
});

// Start Everything
(async function() {
    // Initial UI Language
    setLanguage(window.currentLang || "pt");

    // Initial fetch of settings
    const res = await fetch("/api/settings");
    const data = await res.json();
    document.getElementById("link-vp").value = data.vehicle_positions || "";
    document.getElementById("link-tu").value = data.trip_updates || "";
    document.getElementById("link-a").value = data.alerts || "";
    
    await loadPresets();
    pollData();
    pollIntervalId = setInterval(pollData, 30000);
    
    // Final map fix
    setTimeout(() => map.invalidateSize(), 500);
})();

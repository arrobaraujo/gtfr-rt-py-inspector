// Base Map Config
const map = L.map('map').fitWorld();
let isFirstLoad = true;

let currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Arrow / Bus Icon HTML factory
function getBusIcon(colorHex) {
    const color = colorHex ? '#' + colorHex : 'var(--accent)';
    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 21V3M12 3l7 7M12 3l-7 7"/>
                </svg>
               </div>`,
        className: 'bus-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
}

let vehicleMarkers = {};
let routeShapes = {};
let currentShapeLayer = null;
let currentSelectedVehicle = null;

// UI Elements
const metricsVehicles = document.getElementById('metrics-vehicles');
const metricsAlerts = document.getElementById('metrics-alerts');
const linkVp = document.getElementById('link-vp');
const linkTu = document.getElementById('link-tu');
const linkA = document.getElementById('link-a');
const loadingOverlay = document.getElementById('loading-overlay');
const settingsStatus = document.getElementById('settings-status');
const uploadStatus = document.getElementById('upload-status');
const alertsContainer = document.getElementById('alerts-container');
const chkStops = document.getElementById('chk-stops');
const chkFocus = document.getElementById('chk-focus');
const chkLightMap = document.getElementById('chk-light-map');
const chkSpeedKmh = document.getElementById('chk-speed-kmh');
const chkRawData = document.getElementById('chk-raw-data');
const rawDataContainer = document.getElementById('raw-data-container');
const syncIntervalInput = document.getElementById('sync-interval');
let lastVehicles = [];
let lastRawData = null;
let pollIntervalId = null;

function startPolling(ms) {
    if(pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(pollData, ms);
}

// Init
async function init() {
    await loadSettings();
    pollData();
    startPolling(30000); // 30 seconds polling default
    
    // Set initial language from HTML config or locale
    setLanguage(window.currentLang || 'pt');
    
    chkStops.addEventListener('change', () => {
        if(currentSelectedVehicle) {
            handleMarkerClick(currentSelectedVehicle);
        }
    });

    chkFocus.addEventListener('change', () => {
        updateMap(lastVehicles);
        if(!chkFocus.checked && currentSelectedVehicle) {
            map.setView([currentSelectedVehicle.lat, currentSelectedVehicle.lon]);
        }
    });
    
    if(chkSpeedKmh) {
        chkSpeedKmh.addEventListener('change', () => {
            updateMap(lastVehicles);
        });
    }

    chkLightMap.addEventListener('change', () => {
        if(currentTileLayer) map.removeLayer(currentTileLayer);
        const url = chkLightMap.checked 
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            
            currentTileLayer = L.tileLayer(url, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
        });
        
    if(chkRawData) {
        chkRawData.addEventListener('change', () => {
            if(chkRawData.checked) {
                document.getElementById('map').style.visibility = 'hidden';
                rawDataContainer.style.display = 'block';
                if(lastRawData) {
                    rawDataContainer.innerText = JSON.stringify(lastRawData, null, 2);
                }
            } else {
                document.getElementById('map').style.visibility = 'visible';
                rawDataContainer.style.display = 'none';
                setTimeout(() => map.invalidateSize(), 150);
            }
        });
    }
}

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        linkVp.value = data.vehicle_positions || "";
        linkTu.value = data.trip_updates || "";
        linkA.value = data.alerts || "";
    } catch (e) {
        console.error("Erro ao carregar settings", e);
    }
}

async function saveSettings() {
    try {
        const payload = {
            vehicle_positions: linkVp.value,
            trip_updates: linkTu.value,
            alerts: linkA.value
        };
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        // Update polling interval
        const seconds = parseInt(syncIntervalInput.value) || 30;
        const clampedSeconds = Math.max(2, Math.min(seconds, 300));
        startPolling(clampedSeconds * 1000);

        settingsStatus.textContent = t('msg_settings_saved');
        settingsStatus.className = "status-msg success";
        setTimeout(() => { settingsStatus.textContent = ""; }, 3000);
        // Force immediate refresh
        isFirstLoad = true;
        pollData();
    } catch (e) {
        settingsStatus.textContent = t('msg_settings_err');
        settingsStatus.className = "status-msg error";
    }
}

async function uploadGTFS() {
    const fileInput = document.getElementById('gtfs-upload');
    const file = fileInput.files[0];
    if (!file) {
        uploadStatus.textContent = t('msg_gtfs_select');
        uploadStatus.className = "status-msg error";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    uploadStatus.textContent = t('msg_uploading');
    uploadStatus.className = "status-msg";

    try {
        const res = await fetch('/api/upload-gtfs', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if(data.status === 'success') {
            uploadStatus.textContent = t('msg_gtfs_success');
            uploadStatus.className = "status-msg success";
        } else {
            uploadStatus.textContent = data.message; // generic error from python
            uploadStatus.className = "status-msg error";
        }
    } catch (e) {
        uploadStatus.textContent = t('msg_gtfs_err');
        uploadStatus.className = "status-msg error";
    }
}

async function pollData() {
    loadingOverlay.classList.remove('hidden');
    try {
        const res = await fetch('/api/rt');
        const data = await res.json();
        
        lastRawData = data;
        
        if (chkRawData && chkRawData.checked && rawDataContainer) {
             rawDataContainer.innerText = JSON.stringify(data, null, 2);
             rawDataContainer.style.display = 'block';
             document.getElementById('map').style.visibility = 'hidden';
        }
        
        updateMap(data.vehicles);
        updateAlerts(data.alerts);
        
        lastVehicles = data.vehicles;
        metricsVehicles.innerText = data.vehicles.length;
        metricsAlerts.innerText = data.alerts.length;

    } catch (e) {
        console.error("Erro ao buscar dados RT", e);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

function updateMap(vehicles) {
    const currentIds = new Set();
    const bounds = L.latLngBounds();

    const shouldFocus = chkFocus.checked && currentSelectedVehicle;
    const focusedVehicleId = shouldFocus ? (currentSelectedVehicle.vehicle_id || currentSelectedVehicle.id) : null;

    vehicles.forEach(v => {
        const vId = v.vehicle_id || v.id;
        
        if (shouldFocus && vId !== focusedVehicleId) {
            return;
        }

        currentIds.add(vId);
        
        const latlng = [v.lat, v.lon];
        
        if (!vehicleMarkers[vId]) {
            // New marker
            const marker = L.marker(latlng, {
                icon: getBusIcon(),
                rotationAngle: v.bearing || 0,
                rotationOrigin: 'center center'
            }).addTo(map);
            
            marker.bindPopup(createPopupContent(v));
            marker.on('click', () => handleMarkerClick(v));
            
            vehicleMarkers[vId] = marker;
        } else {
            // Update existing marker
            const marker = vehicleMarkers[vId];
            marker.setLatLng(latlng);
            // If plugin loaded, update rotation
            if (marker.setRotationAngle) marker.setRotationAngle(v.bearing || 0);

            marker.setPopupContent(createPopupContent(v));
            marker.vehicleData = v;
        }

        if(isFirstLoad) {
            bounds.extend(latlng);
        }
    });

    // Remove old markers
    for (let id in vehicleMarkers) {
        if (!currentIds.has(id)) {
            map.removeLayer(vehicleMarkers[id]);
            delete vehicleMarkers[id];
        }
    }

    if (isFirstLoad && vehicles.length > 0) {
        map.fitBounds(bounds, {padding: [50, 50]});
        isFirstLoad = false;
    }
}

// Helper for translations
function t(key) {
    return translations[window.currentLang] ? (translations[window.currentLang][key] || key) : key;
}

function createPopupContent(v) {
    const routeShortName = v.route_short_name || t('na');
    const routeName = v.route_long_name || t('na');
    const descInfo = v.route_desc || t('na');
    const headsign = v.trip_headsign || t('na');
    const direction = v.direction_id || t('na');
    const fare = (v.fare_price !== null && v.fare_price !== undefined) ? v.fare_price.toLocaleString('pt-BR', { style: 'currency', currency: v.fare_currency || 'BRL' }) : t('na');
    const partida = v.start_time || t('na');
    
    let isSpeedKmh = chkSpeedKmh && chkSpeedKmh.checked;
    let finalSpeed = v.speed || 0;
    if (!isSpeedKmh) finalSpeed *= 3.6;

    return `
        <div class="popup-content">
            <h3>${t('popup_vehicle')}: ${v.vehicle_id || v.id}</h3>
            <p><strong>${t('popup_id')}:</strong> ${v.route_id || t('na')}</p>
            <p><strong>${t('popup_route')}:</strong> ${routeShortName}</p>
            <p><strong>${t('popup_route_name')}:</strong> ${routeName}</p>
            <p><strong>${t('popup_desc')}:</strong> ${descInfo}</p>
            <p><strong>${t('popup_dest')}:</strong> ${headsign}</p>
            <p><strong>${t('popup_dir')}:</strong> ${direction}</p>
            <p><strong>${t('popup_fare')}:</strong> ${fare}</p>
            <p><strong>${t('popup_depart')}:</strong> ${partida}</p>
            <p><strong>${t('popup_speed')}:</strong> ${Math.round(finalSpeed)} km/h</p>
            <p><strong>${t('popup_last_update')}:</strong> ${new Date(v.timestamp * 1000).toLocaleTimeString()}</p>
        </div>
    `;
}

async function handleMarkerClick(vehicle) {
    if (!vehicle.trip_id) return;
    currentSelectedVehicle = vehicle;
    
    try {
        const res = await fetch(`/api/trip-shape/${vehicle.trip_id}`);
        if(res.status !== 200) return;
        
        const shapeData = await res.json();
        
        if(currentShapeLayer) {
            map.removeLayer(currentShapeLayer);
        }
        
        const shapeColor = 'var(--accent)';
        const showStops = chkStops.checked;
        
        currentShapeLayer = L.geoJSON(shapeData, {
            filter: function(feature) {
                if (feature.properties.type === "stop") {
                    return showStops;
                }
                return true; // shape
            },
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: "#ffffff",
                    color: shapeColor,
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                if (feature.properties.type === "stop") {
                    const p = feature.properties;
                    let pContent = `<div class="popup-content" style="font-size: 13px; line-height: 1.4;">`;
                    pContent += `<h3 style="margin: 0 0 8px 0; color: var(--accent); font-size: 1.1rem;">${p.stop_name || t('na')}</h3>`;
                    pContent += `<p><strong>${t('popup_desc')}:</strong> ${p.stop_desc || t('na')}</p>`;
                    pContent += `<p><strong>${t('popup_code')}:</strong> ${p.stop_code || t('na')}</p>`;
                    pContent += `<p><strong>${t('popup_platform')}:</strong> ${p.platform_code || t('na')}</p>`;
                    pContent += `<p><strong>${t('popup_parent')}:</strong> ${p.parent_station || t('na')}</p>`;
                    pContent += `<p><strong>${t('popup_type')}:</strong> ${p.location_type || t('na')}</p>`;
                    pContent += `</div>`;
                    
                    layer.bindPopup(pContent);
                }
            },
            style: function(feature) {
                if (feature.properties.type === "shape") {
                    return {
                        color: shapeColor,
                        weight: 4,
                        opacity: 0.8
                    };
                }
            }
        }).addTo(map);
        
    } catch (e) {
        console.error("Erro ao carregar shape da trip", e);
    }
}

function updateAlerts(alerts) {
    if(alerts.length === 0) {
        alertsContainer.innerHTML = `<p class="empty-state" data-i18n="alerts_empty">${t('alerts_empty')}</p>`;
        return;
    }
    
    alertsContainer.innerHTML = alerts.map(a => `
        <div class="alert-item">
            <h4>${a.header || 'Alerta sem título'}</h4>
            <p>${a.description || ''}</p>
        </div>
    `).join('');
}

// Inicializar na carga da janela
window.onload = init;

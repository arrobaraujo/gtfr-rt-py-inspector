/**
 * GTFS-RT Inspector — Internationalization Engine
 *
 * Lightweight, framework-free i18n system.
 * Supports: Portuguese (pt), English (en), Spanish (es).
 *
 * Usage:
 *   - Static HTML:  <span data-i18n="key">Fallback</span>
 *   - Dynamic JS:   t('key')
 */

const translations = {
    // -----------------------------------------------------------------------
    // Portuguese (default)
    // -----------------------------------------------------------------------
    pt: {
        "app_title": "Inspetor GTFS-RT Python 🚌",
        "app_subtitle": "Monitoramento em Tempo Real",
        "settings_link_vp": "Vehicle Positions",
        "settings_link_tu": "Trip Updates",
        "settings_link_alert": "Alerts",
        "settings_btn_save": "Salvar Configurações",
        "settings_interval": "Intervalo de Relógio (segundos)",
        "upload_title": "Fazer Upload do GTFS Estático",
        "upload_btn": "Fazer Upload e Cruzar Base .zip",
        "visuals_title": "Visuais do Mapa",
        "visuals_light_map": "Fundo do Mapa Claro",
        "visuals_focus": "Ocultar outros veículos ao focar",
        "visuals_stops": "Mostrar Paradas da Linha",
        "visuals_speed_kmh": "Assumir feed recebido em km/h (e não m/s)",
        "visuals_raw_data": "Visualizar Dados Brutos (JSON)",
        "msg_settings_saved": "Configurações salvas!",
        "msg_settings_err": "Erro ao salvar.",
        "msg_gtfs_select": "Selecione um arquivo .zip",
        "msg_uploading": "Fazendo upload e processando... Aguarde.",
        "msg_gtfs_success": "GTFS estático carregado com sucesso!",
        "msg_gtfs_err": "Erro no upload",
        "dir_0": "Ida",
        "dir_1": "Volta",
        "links_title": "Links GTFS-RT",
        "metrics_title": "Métricas de Carga",
        "metrics_vehicles": "Veículos Rastreados:",
        "metrics_alerts": "Alertas de Rota:",
        "alerts_title": "Mural de Alertas (Feeds)",
        "alerts_empty": "Nenhum alerta ativo.",
        "loading_msg": "Sincronizando dados...",
        "popup_vehicle": "Veículo",
        "popup_id": "ID da Linha",
        "popup_route": "Linha",
        "popup_route_name": "Nome da Linha",
        "popup_desc": "Descrição",
        "popup_dest": "Destino",
        "popup_dir": "Sentido",
        "popup_fare": "Tarifa",
        "popup_depart": "Partida",
        "popup_speed": "Velocidade",
        "popup_last_update": "Última att",
        "popup_code": "Código",
        "popup_platform": "Plataforma",
        "popup_parent": "Estação Mãe",
        "popup_type": "Tipo",
        "na": "N/A"
    },

    // -----------------------------------------------------------------------
    // English
    // -----------------------------------------------------------------------
    en: {
        "app_title": "GTFS-RT Python Inspector 🚌",
        "app_subtitle": "Real-Time Monitoring",
        "settings_link_vp": "Vehicle Positions",
        "settings_link_tu": "Trip Updates",
        "settings_link_alert": "Alerts",
        "settings_btn_save": "Save Configuration",
        "settings_interval": "Polling Interval (seconds)",
        "upload_title": "Upload Static GTFS",
        "upload_btn": "Upload and Merge .zip Base",
        "visuals_title": "Map Visuals",
        "visuals_light_map": "Light Map Background",
        "visuals_focus": "Hide other vehicles on focus",
        "visuals_stops": "Show Line Stops",
        "visuals_speed_kmh": "Assume feed is already in km/h (not m/s)",
        "visuals_raw_data": "View Raw JSON Data",
        "msg_settings_saved": "Configuration saved!",
        "msg_settings_err": "Error saving config.",
        "msg_gtfs_select": "Please select a .zip file",
        "msg_uploading": "Uploading and processing... Please wait.",
        "msg_gtfs_success": "Static GTFS loaded successfully!",
        "msg_gtfs_err": "Upload error",
        "dir_0": "Outbound",
        "dir_1": "Inbound",
        "links_title": "GTFS-RT Links",
        "metrics_title": "Payload Metrics",
        "metrics_vehicles": "Tracked Vehicles:",
        "metrics_alerts": "Route Alerts:",
        "alerts_title": "Alerts Wall (Feeds)",
        "alerts_empty": "No active alerts.",
        "loading_msg": "Syncing data...",
        "popup_vehicle": "Vehicle",
        "popup_id": "Route ID",
        "popup_route": "Route",
        "popup_route_name": "Route Name",
        "popup_desc": "Description",
        "popup_dest": "Headsign",
        "popup_dir": "Direction",
        "popup_fare": "Fare",
        "popup_depart": "Departure",
        "popup_speed": "Speed",
        "popup_last_update": "Last update",
        "popup_code": "Code",
        "popup_platform": "Platform",
        "popup_parent": "Parent Station",
        "popup_type": "Type",
        "na": "N/A"
    },

    // -----------------------------------------------------------------------
    // Spanish
    // -----------------------------------------------------------------------
    es: {
        "app_title": "Inspector GTFS-RT Python 🚌",
        "app_subtitle": "Monitoreo en Tiempo Real",
        "settings_link_vp": "Posiciones de Vehículos",
        "settings_link_tu": "Actualizaciones de Viaje",
        "settings_link_alert": "Alertas",
        "settings_btn_save": "Guardar Configuración",
        "settings_interval": "Intervalo de Actualización (segundos)",
        "upload_title": "Subir GTFS Estático",
        "upload_btn": "Subir y Cruzar Base .zip",
        "visuals_title": "Visuales del Mapa",
        "visuals_light_map": "Fondo del Mapa Claro",
        "visuals_focus": "Ocultar otros vehículos al enfocar",
        "visuals_stops": "Mostrar Paradas de la Línea",
        "visuals_speed_kmh": "Asumir feed recibido en km/h (y no m/s)",
        "visuals_raw_data": "Ver Datos en Bruto (JSON)",
        "msg_settings_saved": "¡Configuración guardada!",
        "msg_settings_err": "Error al guardar.",
        "msg_gtfs_select": "Seleccione un archivo .zip",
        "msg_uploading": "Subiendo y procesando... Espere.",
        "msg_gtfs_success": "¡GTFS Estático cargado con éxito!",
        "msg_gtfs_err": "Error en la subida",
        "dir_0": "Ida",
        "dir_1": "Vuelta",
        "links_title": "Enlaces GTFS-RT",
        "metrics_title": "Métricas de Carga",
        "metrics_vehicles": "Vehículos Rastreados:",
        "metrics_alerts": "Alertas de Ruta:",
        "alerts_title": "Muro de Alertas",
        "alerts_empty": "No hay alertas activas.",
        "loading_msg": "Sincronizando datos...",
        "popup_vehicle": "Vehículo",
        "popup_id": "ID de Línea",
        "popup_route": "Línea",
        "popup_route_name": "Nombre de Línea",
        "popup_desc": "Descripción",
        "popup_dest": "Destino",
        "popup_dir": "Sentido",
        "popup_fare": "Tarifa",
        "popup_depart": "Salida",
        "popup_speed": "Velocidad",
        "popup_last_update": "Última act.",
        "popup_code": "Código",
        "popup_platform": "Plataforma",
        "popup_parent": "Estación Principal",
        "popup_type": "Tipo",
        "na": "N/A"
    }
};

// Active language (default: Portuguese)
window.currentLang = "pt";

/**
 * Apply the selected language to all DOM elements with [data-i18n] attributes
 * and dispatch a 'languageChanged' event for any listeners.
 *
 * @param {string} lang - Language code ('pt', 'en', or 'es').
 */
function setLanguage(lang) {
    if (!translations[lang]) return;
    window.currentLang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    window.dispatchEvent(new Event("languageChanged"));
}

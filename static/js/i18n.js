/**
 * GTFS-RT Inspector — i18n Engine
 */

const translations = {
    'pt': {
        'app_title': 'GTFS-RT Inspector',
        'app_subtitle': '🚌 Monitoramento em Tempo Real',
        'metrics_title': 'Métricas',
        'metrics_vehicles': 'Veículos Ativos',
        'metrics_alerts': 'Alertas',
        'alerts_title': 'Últimos Alertas',
        'alerts_empty': 'Nenhum alerta ativo encontrado.',
        'upload_title': 'Upload GTFS Estático',
        'upload_btn': 'Processar ZIP',
        'links_title': 'Links GTFS-RT',
        'settings_link_vp': 'Vehicle Positions',
        'settings_link_tu': 'Trip Updates',
        'settings_link_alert': 'Alerts',
        'settings_interval': 'Intervalo de Relógio (segundos)',
        'settings_btn_save': 'Salvar Configurações',
        'sources_title': 'Gerenciar Fontes',
        'source_select_default': 'Selecionar Arquivo...',
        'source_btn_add': 'Novo',
        'source_btn_delete': 'Excluir',
        'visuals_title': 'Visuais do Mapa',
        'visuals_light_map': 'Fundo do Mapa Claro',
        'visuals_focus': 'Ocultar outros veículos ao focar',
        'visuals_stops': 'Mostrar Paradas da Linha',
        'visuals_speed_kmh': 'Assumir velocidade em km/h',
        'visuals_raw_data': 'Visualizar Dados Brutos (JSON)',
        'filters_title': 'Busca e Filtros',
        'filter_vid': 'ID do Veículo',
        'filter_tid': 'Trip ID',
        'filter_rid': 'Route ID',
        'filter_rsn': 'Número da Linha',
        'filter_rln': 'Nome da Linha (route_long_name)',
        'filters_clear': 'Limpar Filtros',
        'export_title': 'Exportar Dados',
        'export_info': 'JSON inclui todos os dados brutos do GTFS-RT. CSV exporta o posicionamento dos veículos apenas.',
        'msg_settings_saved': 'Configurações salvas!',
        'msg_settings_err': 'Erro ao salvar!',
        'msg_gtfs_select': 'Selecione um arquivo!',
        'msg_uploading': 'Processando...',
        'msg_gtfs_success': 'GTFS processado com sucesso!',
        'msg_gtfs_err': 'Erro no processamento!',
        'msg_delete_confirm': 'Tem certeza que deseja excluir esta fonte?',
        'popup_vehicle': 'Veículo',
        'popup_trip': 'ID da Viagem',
        'popup_route': 'Linha',
        'popup_route_name': 'Nome',
        'popup_speed': 'Velocidade',
        'popup_last_update': 'Última atualização',
        'popup_direction': 'Sentido',
        'popup_start_time': 'Início',
        'popup_fare': 'Tarifa',
        'popup_stop_id': 'ID da Parada',
        'popup_stop_code': 'Código da Parada',
        'popup_zone_id': 'Zona (ID)',
        'popup_loc_type': 'Tipo',
        'popup_platform': 'Plataforma',
        'popup_parent': 'Estação Vinculada',
        'dir_0': 'Ida',
        'dir_1': 'Volta',
        'na': 'N/D'
    },
    'en': {
        'app_title': 'GTFS-RT Inspector',
        'app_subtitle': '🚌 Real-Time Monitoring',
        'metrics_title': 'Metrics',
        'metrics_vehicles': 'Active Vehicles',
        'metrics_alerts': 'Alerts',
        'alerts_title': 'Latest Alerts',
        'alerts_empty': 'No active alerts found.',
        'upload_title': 'Upload Static GTFS',
        'upload_btn': 'Process ZIP',
        'links_title': 'GTFS-RT Links',
        'settings_link_vp': 'Vehicle Positions',
        'settings_link_tu': 'Trip Updates',
        'settings_link_alert': 'Alerts',
        'settings_interval': 'Polling Interval (seconds)',
        'settings_btn_save': 'Save Settings',
        'sources_title': 'Manage Sources',
        'source_select_default': 'Select Preset...',
        'source_btn_add': 'New',
        'source_btn_delete': 'Delete',
        'visuals_title': 'Map Visuals',
        'visuals_light_map': 'Light Map Background',
        'visuals_focus': 'Hide others when focusing',
        'visuals_stops': 'Show Route Stops',
        'visuals_speed_kmh': 'Assume feed in km/h',
        'visuals_raw_data': 'View Raw Data (JSON)',
        'filters_title': 'Search & Filters',
        'filter_vid': 'Vehicle ID',
        'filter_tid': 'Trip ID',
        'filter_rid': 'Route ID',
        'filter_rsn': 'Route short name',
        'filter_rln': 'Route long name',
        'filters_clear': 'Clear Filters',
        'export_title': 'Export Data',
        'export_info': 'JSON includes all GTFS-RT raw fields. CSV exports vehicle positions only.',
        'msg_settings_saved': 'Settings saved!',
        'msg_settings_err': 'Error saving!',
        'msg_gtfs_select': 'Select a file!',
        'msg_uploading': 'Processing...',
        'msg_gtfs_success': 'GTFS processed successfully!',
        'msg_gtfs_err': 'Processing error!',
        'msg_delete_confirm': 'Are you sure you want to delete this source?',
        'popup_vehicle': 'Vehicle',
        'popup_trip': 'Trip ID',
        'popup_route': 'Route',
        'popup_route_name': 'Name',
        'popup_speed': 'Speed',
        'popup_last_update': 'Last update',
        'popup_direction': 'Direction',
        'popup_start_time': 'Start Time',
        'popup_fare': 'Fare',
        'popup_stop_id': 'Stop ID',
        'popup_stop_code': 'Stop Code',
        'popup_zone_id': 'Zone ID',
        'popup_loc_type': 'Type',
        'popup_platform': 'Platform',
        'popup_parent': 'Parent Station',
        'dir_0': 'Outbound',
        'dir_1': 'Inbound',
        'na': 'N/A'
    },
    'es': {
        'app_title': 'GTFS-RT Inspector',
        'app_subtitle': '🚌 Monitoreo en Tiempo Real',
        'metrics_title': 'Métricas',
        'metrics_vehicles': 'Vehículos Activos',
        'metrics_alerts': 'Alertas',
        'alerts_title': 'Últimas Alertas',
        'alerts_empty': 'No se encontraron alertas activas.',
        'upload_title': 'Cargar GTFS Estático',
        'upload_btn': 'Procesar ZIP',
        'links_title': 'Enlaces GTFS-RT',
        'settings_link_vp': 'Vehicle Positions',
        'settings_link_tu': 'Trip Updates',
        'settings_link_alert': 'Alerts',
        'settings_interval': 'Intervalo de Sincronización (seg)',
        'settings_btn_save': 'Guardar Configuración',
        'sources_title': 'Gestionar Fuentes',
        'source_select_default': 'Seleccionar Preset...',
        'source_btn_add': 'Nuevo',
        'source_btn_delete': 'Eliminar',
        'visuals_title': 'Visuales del Mapa',
        'visuals_light_map': 'Fondo de Mapa Claro',
        'visuals_focus': 'Ocultar otros al enfocar',
        'visuals_stops': 'Mostrar Paradas de Línea',
        'visuals_speed_kmh': 'Asumir feed en km/h',
        'visuals_raw_data': 'Ver Datos Brutos (JSON)',
        'filters_title': 'Busca y Filtros',
        'filter_vid': 'ID del Vehículo',
        'filter_tid': 'Trip ID',
        'filter_rid': 'Route ID',
        'filter_rsn': 'Número de Línea',
        'filter_rln': 'Nombre de Línea',
        'filters_clear': 'Limpiar Filtros',
        'export_title': 'Exportar Datos',
        'export_info': 'JSON incluye todos los datos brutos del GTFS-RT. CSV exporta el posicionamiento de los vehículos apenas.',
        'msg_settings_saved': '¡Ajustes guardados!',
        'msg_settings_err': '¡Error al guardar!',
        'msg_gtfs_select': '¡Seleccione un archivo!',
        'msg_uploading': 'Procesando...',
        'msg_gtfs_success': '¡GTFS procesado con éxito!',
        'msg_gtfs_err': '¡Error de procesamiento!',
        'msg_delete_confirm': '¿Está seguro de eliminar esta fuente?',
        'popup_vehicle': 'Vehículo',
        'popup_trip': 'ID del Viaje',
        'popup_route': 'Línea',
        'popup_route_name': 'Nombre',
        'popup_speed': 'Velocidad',
        'popup_last_update': 'Última actualización',
        'popup_direction': 'Sentido',
        'popup_start_time': 'Inicio',
        'popup_fare': 'Tarifa',
        'popup_stop_id': 'ID de Parada',
        'popup_stop_code': 'Código de Parada',
        'popup_zone_id': 'Zona (ID)',
        'popup_loc_type': 'Tipo',
        'popup_platform': 'Plataforma',
        'popup_parent': 'Estación Principal',
        'dir_0': 'Ida',
        'dir_1': 'Volta',
        'na': 'N/D'
    }
};

window.currentLang = 'pt';

function setLanguage(lang) {
    if (!translations[lang]) return;
    window.currentLang = lang;

    // Update elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update tooltips (titles)
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        if (translations[lang][key]) {
            el.setAttribute("title", translations[lang][key]);
        }
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
}

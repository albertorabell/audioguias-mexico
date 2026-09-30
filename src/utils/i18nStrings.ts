/**
 * Centralized UI Strings and Internationalization Dictionary
 * Designed for easy multi-language localization (es, en, fr, pl, ru, ja).
 * Content is editorial by Audioguías México.
 */

export const UI_STRINGS = {
  es: {
    appName: 'Audioguías México',
    officialBadge: 'Contenido editorial de Audioguías México',
    nationalMuseumTitle: 'Museo Nacional de Antropología',
    patrimonyCdmx: 'Contenido editorial de Audioguías México',
    heroTitle: 'Tu curador personal de bolsillo',
    heroSubtitle:
      'Audioguías inmersivas en alta fidelidad para los recintos culturales y arqueológicos más emblemáticos de México.',
    exploreMna: 'Explorar Museo de Antropología',
    
    // Model and Premium Pass
    premiumPassTitle: '¿Cómo funciona el Pase Premium?',
    premiumPassSubtitle: 'Modelo de Acceso Transparente',
    onlyPricePerSite: (price: number) => `Solo $${price} MXN por recinto`,
    noSubscriptions: 'Sin suscripciones',
    featureFullGuides: 'Audioguías completas para todas las piezas',
    featureFullGuidesDesc:
      'Desbloquea explicaciones curatoriales profundas, mitos desmentidos y retos de observación detallados para cada vitrina y sala sin límites.',
    featureOffline: 'Uso 100% sin conexión (offline)',
    featureOfflineDesc:
      'Los guiones y audios se guardan en la memoria de tu dispositivo. Funciona sin problemas en salas subterráneas, bóvedas o zonas arqueológicas sin señal.',
    feature72Hours: 'Vigencia de 72 horas para 2 dispositivos',
    feature72HoursDesc:
      'Visita el museo a tu propio ritmo hoy y vuelve mañana. Válido para compartir con tu acompañante con un solo código de activación.',

    // Navigation and Actions
    back: 'Atrás',
    backToMuseum: 'Volver al museo',
    backToSites: 'Lista de museos',
    backToExplorer: 'Volver al explorador',
    goHome: 'Ir al inicio',
    designAnotherRoute: 'Diseñar otra ruta',
    repeatTour: 'Repetir este recorrido',
    exploreAnotherRoom: 'Explorar otra sala',
    exploreRoomAndStart: 'Explorar Sala e Iniciar Recorrido',
    tourThisRoom: 'Recorrer esta sala',
    startTour: 'Iniciar Recorrido',
    chooseAtLeastOneStop: 'Elige al menos una parada',
    includesPiedraDelSol: 'Incluye la Piedra del Sol (imperdible)',
    comingSoon: 'Próximamente',
    comingSoonNotice: 'Próximamente: este recinto se encuentra en desarrollo.',
    
    // Map and Rooms
    groundFloor: 'Planta Baja',
    upperFloor: 'Planta Alta',
    archaeology: 'Arqueología',
    ethnography: 'Etnografía',
    roomsLabel: (count: number) => `${count} salas`,
    piecesLabel: (count: number) => `${count} obras`,
    paraguasLabel: 'EL PARAGUAS',
    architectCredit: 'Pedro Ramírez Vázquez · 1964',

    // Tour Completion
    tourCompletedTitle: '¡Recorrido Completado!',
    tourCompletedBadge: 'RECORRIDO CONCLUIDO',
    tourCompletedDesc: (routeName: string) =>
      `Has recorrido con éxito la ruta de ${routeName} en el Museo Nacional de Antropología.`,
    roomsExplored: 'Salas exploradas',
    piecesExplored: 'Piezas exploradas',

    // Error and Fallback
    errorTitle: 'Ha ocurrido un detalle inesperado',
    errorDesc: 'No te preocupes, tus datos y recorrido están a salvo. Puedes regresar al inicio.',
    errorButton: 'Volver al inicio',
    retryButton: 'Reintentar',
    noSpanishVoice: 'Tu teléfono no tiene voz en español. Puedes leer el texto o instalar una voz en Ajustes.',
  },
};

export type LanguageKey = 'es';
export const t = UI_STRINGS.es;

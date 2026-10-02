import { defineGroup } from '../define';

/** Asistente para diseñar una ruta. */
export const wizard = defineGroup(
  {
    back: 'Volver al explorador',
    kicker: 'Curaduría inteligente',
    title: (siteName: string) => `Diseña tu recorrido en ${siteName}`,
    defaultSite: 'el museo',
    intro: 'Configura tu tiempo e intereses. El sistema ordenará las obras sin brincar entre pisos: primero Planta Baja (00→11) y luego Planta Alta (12→21).',
    sunStoneTitle: 'Incluye la Piedra del Sol (imperdible)',
    sunStoneDesc: 'Toda ruta curada garantiza la visita al monolito cumbre de la Sala Mexica.',
    q1: '1. ¿Cuánto tiempo tienes para tu visita?',
    unlimited: 'Sin límite',
    minutes: (n: number) => `${n} min`,
    timeOptions: [
      { mins: 30, label: '30 min', badge: 'Rápida', desc: '~5 paradas · 1-2 salas' },
      { mins: 60, label: '1 hora', badge: 'Estándar', desc: '~10 paradas · 3-4 salas' },
      { mins: 120, label: '2 horas', badge: 'Completa', desc: '~20 paradas · PB y PA' },
      { mins: 999, label: 'Sin límite', badge: 'Exhaustiva', desc: 'Recorrido por las 22 salas' },
    ],
    q2: '2. ¿Qué temas o culturas deseas priorizar?',
    selected: (n: number) => `${n} ${n === 1 ? 'seleccionado' : 'seleccionados'}`,
    tags: {
      'cosmogonia-mexica': { label: 'Cosmogonía mexica y Altiplano', subtitle: 'Piedra del Sol, Coatlicue y la cosmovisión de Tenochtitlan' },
      'mundo-maya': { label: 'Mundo maya y selva', subtitle: 'Pakal, jadeítas de Calakmul, estelas y comunidades mayas vivas' },
      'arte-monumental': { label: 'Arte monumental y escultórico', subtitle: 'Cabezas olmecas colosales, monolitos y escultura en basalto' },
      'vida-cotidiana-tumbas': { label: 'Pueblos originarios y etnografía', subtitle: 'Tumbas de Oaxaca, Occidente y los pueblos de hoy: textiles, milpa, fiestas y lenguas' },
    } as Record<string, { label: string; subtitle: string }>,
    readyTitle: 'Ruta optimizada lista',
    readySummary: (stops: number, rooms: number, duration: string) =>
      `${stops} ${stops === 1 ? 'parada' : 'paradas'} · ${rooms} ${rooms === 1 ? 'sala' : 'salas'} · ~${duration}`,
    mustSee: 'Imperdible',
    hideSuggested: 'Ocultar catálogo de rutas sugeridas',
    showSuggested: '¿Prefieres una ruta sugerida del museo?',
    startTour: (stops: number, duration: string) => `Iniciar recorrido (${stops} paradas · ~${duration})`,
    pickOne: 'Elige al menos una parada',
  },
  {
    back: 'Back to explorer',
    kicker: 'Smart curation',
    title: (siteName: string) => `Design your tour of ${siteName}`,
    defaultSite: 'the museum',
    intro: 'Set your time and interests. The system will order the works without jumping between floors: Ground floor first (00→11), then Upper floor (12→21).',
    sunStoneTitle: 'Includes the Sun Stone (a must-see)',
    sunStoneDesc: 'Every curated route guarantees a visit to the great monolith of the Mexica room.',
    q1: '1. How much time do you have for your visit?',
    unlimited: 'No limit',
    minutes: (n: number) => `${n} min`,
    timeOptions: [
      { mins: 30, label: '30 min', badge: 'Quick', desc: '~5 stops · 1-2 rooms' },
      { mins: 60, label: '1 hour', badge: 'Standard', desc: '~10 stops · 3-4 rooms' },
      { mins: 120, label: '2 hours', badge: 'Complete', desc: '~20 stops · Ground and Upper floor' },
      { mins: 999, label: 'No limit', badge: 'Exhaustive', desc: 'A tour of all 22 rooms' },
    ],
    q2: '2. Which themes or cultures would you like to prioritize?',
    selected: (n: number) => `${n} selected`,
    tags: {
      'cosmogonia-mexica': { label: 'Mexica cosmogony and the Highlands', subtitle: 'Sun Stone, Coatlicue and the worldview of Tenochtitlan' },
      'mundo-maya': { label: 'Maya world and jungle', subtitle: 'Pakal, Calakmul jade, stelae and living Maya communities' },
      'arte-monumental': { label: 'Monumental art and sculpture', subtitle: 'Colossal Olmec heads, monoliths and basalt sculpture' },
      'vida-cotidiana-tumbas': { label: 'Indigenous peoples and ethnography', subtitle: 'Tombs of Oaxaca, the West and peoples of today: textiles, milpa, festivals and languages' },
    } as Record<string, { label: string; subtitle: string }>,
    readyTitle: 'Optimized route ready',
    readySummary: (stops: number, rooms: number, duration: string) =>
      `${stops} ${stops === 1 ? 'stop' : 'stops'} · ${rooms} ${rooms === 1 ? 'room' : 'rooms'} · ~${duration}`,
    mustSee: 'Must-see',
    hideSuggested: 'Hide the suggested routes',
    showSuggested: 'Prefer a route suggested by the museum?',
    startTour: (stops: number, duration: string) => `Start tour (${stops} stops · ~${duration})`,
    pickOne: 'Pick at least one stop',
  }
);

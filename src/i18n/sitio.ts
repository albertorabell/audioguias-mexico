import type { SupportedLanguage } from './languages';

/**
 * Palabras para un sitio arqueológico al aire libre (Teotihuacán): «zona» y «parada» en lugar de «sala» y «obra».
 * Solo se cambian las frases que mencionan museo, sala, obra, vitrina o piso; lo demás se queda como en el museo.
 * Lo que no esté aquí en un idioma se toma del español (ver getStrings).
 */
export type SiteKind = 'museum' | 'site';

const plural = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`;
const pl = (c: number, one: string, few: string, many: string) => {
  const m10 = c % 10;
  const m100 = c % 100;
  const w = c === 1 ? one : m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14) ? few : many;
  return `${c} ${w}`;
};

const es = {
  common: {
    museumName: 'Zona Arqueológica de Teotihuacán',
    roomWord: 'Zona',
  },
  chrome: { nav: { museumName: 'ZONA ARQUEOLÓGICA DE TEOTIHUACÁN' } },
  ui: {
    worksCount: (c: number) => plural(c, 'parada', 'paradas'),
    roomsCount: (c: number) => plural(c, 'zona', 'zonas'),
    routeMeta: (duration: string, stops: number) => `${duration} · ${plural(stops, 'parada', 'paradas')}`,
    tabs: { aria: 'Secciones del sitio', museum: 'Sitio' },
    museum: { rooms: 'Zonas' },
    room: { start: 'Recorrer la zona', works: 'Paradas en esta zona' },
    piece: {
      prev: 'Parada anterior',
      next: 'Siguiente parada',
      nextRoom: 'Siguiente zona',
      lookTitle: 'Observa a tu alrededor',
      lookHint: 'Marca cada detalle cuando lo encuentres.',
      moreInRoom: 'Más en esta zona',
      lockedBody: 'Escucha y lee la historia de esta parada, con sus retos de observación, el mito y la ficha.',
      linkedPiece: 'Parada relacionada',
      peekOpen: 'Ver la parada completa',
    },
    map: { title: 'Plano del sitio', hint: 'Toca una zona para ver sus paradas.' },
    search: {
      placeholder: 'Busca una parada, zona o cultura',
      rooms: 'Zonas',
      featured: 'Paradas destacadas',
      noResultsHint: 'Prueba con otra palabra, el número de zona o una cultura, como «maya».',
    },
  },
  tour: {
    completedDesc: (routeName: string) => `Has completado la ruta «${routeName}» en Teotihuacán.`,
    rooms: 'Zonas',
    pieces: 'Paradas',
    backToExplorer: 'Ver las zonas del sitio',
  },
  offline: { notCachedDesc: 'En la zona arqueológica la señal puede ser débil. Descarga las fotos y los audios antes de llegar.' },
  paywall: {
    benefits: { guidesDesc: 'Todas las paradas del sitio, explicadas con detalle.', offlineTitle: 'Modo 100% sin conexión en el sitio' },
    unavailable: 'El pago en línea estará disponible muy pronto. Mientras tanto puedes escuchar las paradas gratuitas.',
  },
  app: {
    backToRooms: 'Volver a las zonas',
    defaultRouteName: 'Recorrido por el sitio',
    pieceNotFound: 'No se encontró información para esta parada.',
  },
  media: { defaultAlt: 'Parada de Teotihuacán' },
  player: {
    scriptOnlySpanish: 'Esta parada todavía no tiene texto en este idioma. Se muestra y se lee en español.',
    defaultPieceSummary: 'Parada de la zona arqueológica.',
  },
  piece: { defaultTitle: 'Parada de Teotihuacán' },
};

const en = {
  common: {
    museumName: 'Teotihuacan Archaeological Zone',
    roomWord: 'Zone',
  },
  chrome: { nav: { museumName: 'TEOTIHUACAN ARCHAEOLOGICAL ZONE' } },
  ui: {
    worksCount: (c: number) => plural(c, 'stop', 'stops'),
    roomsCount: (c: number) => plural(c, 'zone', 'zones'),
    routeMeta: (duration: string, stops: number) => `${duration} · ${plural(stops, 'stop', 'stops')}`,
    tabs: { aria: 'Site sections', museum: 'Site' },
    museum: { rooms: 'Zones' },
    room: { start: 'Walk this zone', works: 'Stops in this zone' },
    piece: {
      prev: 'Previous stop',
      next: 'Next stop',
      nextRoom: 'Next zone',
      lookTitle: 'Look around you',
      lookHint: 'Tick each detail when you find it.',
      moreInRoom: 'More in this zone',
      lockedBody: 'Listen to and read the story of this stop, with its observation challenges, the myth and the fact sheet.',
      linkedPiece: 'Related stop',
      peekOpen: 'See the full stop',
    },
    map: { title: 'Site plan', hint: 'Tap a zone to see its stops.' },
    search: {
      placeholder: 'Search a stop, zone or culture',
      rooms: 'Zones',
      featured: 'Featured stops',
      noResultsHint: 'Try another word, the zone number or a culture, such as “Maya”.',
    },
  },
  tour: {
    completedDesc: (routeName: string) => `You have completed the “${routeName}” route at Teotihuacan.`,
    rooms: 'Zones',
    pieces: 'Stops',
    backToExplorer: 'See the zones of the site',
  },
  offline: { notCachedDesc: 'The signal can be weak at the archaeological site. Download the photos and audio before you arrive.' },
  paywall: {
    benefits: { guidesDesc: 'Every stop of the site, explained in detail.', offlineTitle: '100% offline mode at the site' },
    unavailable: 'Online payment will be available very soon. In the meantime you can listen to the free stops.',
  },
  app: {
    backToRooms: 'Back to the zones',
    defaultRouteName: 'Route through the site',
    pieceNotFound: 'No information was found for this stop.',
  },
  media: { defaultAlt: 'Stop at Teotihuacan' },
  player: {
    scriptOnlySpanish: 'This stop does not have text in this language yet. It is shown and read in Spanish.',
    defaultPieceSummary: 'A stop at the archaeological site.',
  },
  piece: { defaultTitle: 'Stop at Teotihuacan' },
};

const fr = {
  common: {
    museumName: 'Zone archéologique de Teotihuacan',
    roomWord: 'Zone',
  },
  chrome: { nav: { museumName: 'ZONE ARCHÉOLOGIQUE DE TEOTIHUACAN' } },
  ui: {
    worksCount: (c: number) => plural(c, 'étape', 'étapes'),
    roomsCount: (c: number) => plural(c, 'zone', 'zones'),
    routeMeta: (duration: string, stops: number) => `${duration} · ${plural(stops, 'étape', 'étapes')}`,
    tabs: { aria: 'Sections du site', museum: 'Site' },
    museum: { rooms: 'Zones' },
    room: { start: 'Parcourir la zone', works: 'Étapes de cette zone' },
    piece: {
      prev: 'Étape précédente',
      next: 'Étape suivante',
      nextRoom: 'Zone suivante',
      lookTitle: 'Observez autour de vous',
      lookHint: 'Cochez chaque détail quand vous le trouvez.',
      moreInRoom: 'Plus dans cette zone',
      lockedBody: 'Écoutez et lisez l’histoire de cette étape, avec ses défis d’observation, le mythe et la fiche.',
      linkedPiece: 'Étape liée',
      peekOpen: 'Voir l’étape complète',
    },
    map: { title: 'Plan du site', hint: 'Touchez une zone pour voir ses étapes.' },
    search: {
      placeholder: 'Cherchez une étape, une zone ou une culture',
      rooms: 'Zones',
      featured: 'Étapes à ne pas manquer',
      noResultsHint: 'Essayez un autre mot, le numéro de la zone ou une culture, comme « maya ».',
    },
  },
  tour: {
    completedDesc: (routeName: string) => `Vous avez terminé le parcours « ${routeName} » à Teotihuacan.`,
    rooms: 'Zones',
    pieces: 'Étapes',
    backToExplorer: 'Voir les zones du site',
  },
  offline: { notCachedDesc: 'Le signal peut être faible sur le site archéologique. Téléchargez les photos et les audios avant d’arriver.' },
  paywall: {
    benefits: { guidesDesc: 'Toutes les étapes du site, expliquées en détail.', offlineTitle: 'Mode 100 % hors ligne sur le site' },
    unavailable: 'Le paiement en ligne sera disponible très bientôt. En attendant, vous pouvez écouter les étapes gratuites.',
  },
  app: {
    backToRooms: 'Retour aux zones',
    defaultRouteName: 'Parcours du site',
    pieceNotFound: 'Aucune information trouvée pour cette étape.',
  },
  media: { defaultAlt: 'Étape de Teotihuacan' },
  player: {
    scriptOnlySpanish: 'Cette étape n’a pas encore de texte dans cette langue. Elle s’affiche et se lit en espagnol.',
    defaultPieceSummary: 'Une étape du site archéologique.',
  },
  piece: { defaultTitle: 'Étape de Teotihuacan' },
};

const plz = (c: number) => pl(c, 'strefa', 'strefy', 'stref');
const pls = (c: number) => pl(c, 'przystanek', 'przystanki', 'przystanków');
const pl_ = {
  common: {
    museumName: 'Strefa archeologiczna Teotihuacán',
    roomWord: 'Strefa',
    pieceWord: 'Przystanek',
    roomsLabel: plz,
    piecesLabel: pls,
  },
  chrome: { nav: { museumName: 'STREFA ARCHEOLOGICZNA TEOTIHUACÁN' } },
  ui: {
    worksCount: pls,
    roomsCount: plz,
    routeMeta: (duration: string, stops: number) => `${duration} · ${pls(stops)}`,
    tabs: { aria: 'Sekcje stanowiska', museum: 'Stanowisko' },
    museum: { startHereSub: 'Dwie gotowe trasy: ekspresowa i pełna.', rooms: 'Strefy' },
    room: { start: 'Przejdź strefę', works: 'Przystanki w tej strefie' },
    piece: {
      prev: 'Poprzedni przystanek',
      next: 'Następny przystanek',
      nextRoom: 'Następna strefa',
      lookTitle: 'Rozejrzyj się wokół',
      lookHint: 'Zaznacz każdy szczegół, gdy go znajdziesz.',
      moreInRoom: 'Więcej w tej strefie',
      lockedBody: 'Posłuchaj i przeczytaj historię tego przystanku, z zadaniami obserwacyjnymi, mitem i kartą informacyjną.',
      linkedPiece: 'Powiązany przystanek',
      peekOpen: 'Zobacz cały przystanek',
    },
    map: { title: 'Plan stanowiska', hint: 'Dotknij strefy, aby zobaczyć jej przystanki.' },
    search: {
      placeholder: 'Szukaj przystanku, strefy lub kultury',
      rooms: 'Strefy',
      featured: 'Wyróżnione przystanki',
      noResultsHint: 'Spróbuj innego słowa, numeru strefy lub kultury, np. „Majowie”.',
    },
  },
  tour: {
    completedDesc: (routeName: string) => `Ukończyłeś trasę „${routeName}” w Teotihuacán.`,
    rooms: 'Strefy',
    pieces: 'Przystanki',
    piecesSub: 'odwiedzone przystanki',
    backToExplorer: 'Zobacz strefy stanowiska',
  },
  offline: { notCachedDesc: 'Na stanowisku archeologicznym zasięg może być słaby. Pobierz zdjęcia i nagrania, zanim dojedziesz.' },
  paywall: {
    benefits: { guidesDesc: 'Wszystkie przystanki stanowiska, objaśnione ze szczegółami.', offlineTitle: 'Tryb w pełni offline na stanowisku' },
    unavailable: 'Płatności online będą dostępne już wkrótce. Do tego czasu możesz słuchać bezpłatnych przystanków.',
  },
  app: {
    backToRooms: 'Wróć do stref',
    defaultRouteName: 'Trasa po stanowisku',
    mapDefaultTitle: 'Plan stanowiska',
    pieceNotFound: 'Nie znaleziono informacji o tym przystanku.',
    pieceLoadFailDesc: 'Wystąpił problem podczas wczytywania tego przystanku. Twój postęp na trasie jest bezpieczny.',
    roomFallback: 'strefa',
  },
  media: { defaultAlt: 'Przystanek w Teotihuacán' },
  player: {
    scriptOnlySpanish: 'Ten przystanek nie ma jeszcze tekstu w tym języku. Jest wyświetlany i czytany po hiszpańsku.',
    defaultPieceSummary: 'Przystanek na stanowisku archeologicznym.',
  },
  piece: { defaultTitle: 'Przystanek w Teotihuacán' },
};

export const SITE_OVERRIDES: Partial<Record<SupportedLanguage, any>> = { es, en, fr, pl: pl_ };

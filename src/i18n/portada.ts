import type { SupportedLanguage } from './languages';

/**
 * Textos de la portada (pantalla de inicio): promesa, botón de muestra, franja de datos, regiones y pases combinados.
 * Un idioma sin traducción usa el español.
 */
export interface PortadaTexts {
  promesa: string;
  promesaSub: string;
  /** Ventajas (título, texto) debajo de la promesa */
  beneficios: [string, string][];
  muestra: string;
  muestraPausa: string;
  /** Qué se escucha en la muestra */
  muestraDe: string;
  /** Franja de datos */
  paradas: (n: number) => string;
  idiomas: string;
  sinSenal: string;
  desde: (precio: string) => string;
  /** Mientras el acceso es gratis: aviso de que pronto se cobrará */
  gratisAhora: string;
  telefonos: (n: number) => string;
  /** Tarjetas */
  sitiosTitulo: string;
  pase: (precio: string) => string;
  /** Pases combinados */
  combosTitulo: string;
  combosTexto: string;
  combosIncluye: (n: number) => string;
  combosTodos: string;
  /** Cómo funciona (una sola vez) */
  comoTitulo: string;
  /** Etiqueta de las caminatas (tramos entre paradas) */
  caminata: string;
  /** Al terminar una parada gratis */
  gustoTitulo: string;
  /** Aviso de descarga en sitios al aire libre y recorridos urbanos (en los museos se usa el de «offline») */
  descargaAbierto: string;
  /** Descargar más de la ruta recomendada */
  descargaTodo: string;
  descargaRuta: string;
  gustoBoton: string;
  /** Lista de recorridos: abrir y cerrar las paradas de cada uno */
  verParadas: string;
  ocultarParadas: string;
  region: Record<string, string>;
}

const es: PortadaTexts = {
  promesa: "México tiene historias extraordinarias. Escúchalas donde ocurrieron.",
  promesaSub: "Descubre museos, ciudades y zonas arqueológicas con audioguías que te cuentan lo que estás viendo, a tu ritmo y sin depender de un grupo.",
  beneficios: [["Más de 400 paradas cuidadosamente documentadas", "Desde la Piedra del Sol hasta las pirámides de Teotihuacán y Chichén Itzá."], ["Tú decides el recorrido", "Elige una sala o una zona, o sigue una ruta ya armada. Pausa, salta o repite cuando quieras."], ["Funciona sin internet", "Descarga la guía antes de entrar y escúchala aunque no haya señal."], ["En 7 idiomas", "Español, inglés, francés, alemán, italiano, portugués y polaco."]],
  muestra: 'Escucha 30 segundos',
  muestraPausa: 'Pausar',
  muestraDe: 'La Piedra del Sol, en el Museo Nacional de Antropología',
  paradas: (n) => `${n} paradas explicadas`,
  idiomas: '7 idiomas',
  sinSenal: 'Sin señal',
  desde: (p) => `Desde ${p}`,
  gratisAhora: 'Por tiempo limitado, todos los recorridos son gratis.',
  telefonos: (n) => `${n} teléfonos`,
  sitiosTitulo: 'Elige tu sitio',
  pase: (p) => `Pase ${p}`,
  combosTitulo: 'Pases combinados',
  combosTexto: 'Un solo pago para varios sitios, más barato que por separado.',
  combosIncluye: (n) => `${n} sitios`,
  combosTodos: 'Todos los sitios',
  comoTitulo: 'Cómo funciona',
  caminata: 'Caminata',
  gustoTitulo: "¿Te gustó? Desbloquea el resto de las paradas",
  descargaAbierto: "En la zona y en las calles la señal suele ser débil. Descarga fotos y audios antes de salir.",
  descargaTodo: "Descargar todo el sitio",
  descargaRuta: "Descargar solo la ruta recomendada",
  gustoBoton: "Ver el pase de 30 días",
  verParadas: "Ver paradas",
  ocultarParadas: "Ocultar paradas",
  region: { cdmx: 'Ciudad de México', edomex: 'Estado de México', morelos: 'Morelos', yucatan: 'Yucatán' },
};

const en: PortadaTexts = {
  promesa: "Mexico has extraordinary stories. Hear them where they happened.",
  promesaSub: "Discover museums, cities and archaeological sites with audio guides that tell you about what you are looking at, at your own pace and without depending on a group.",
  beneficios: [["More than 400 carefully researched stops", "From the Sun Stone to the pyramids of Teotihuacan and Chichen Itza."], ["You choose the route", "Pick a room or a zone, or follow a ready-made tour. Pause, skip or replay whenever you like."], ["Works without internet", "Download the guide before you go in and listen even with no signal."], ["In 7 languages", "Spanish, English, French, German, Italian, Portuguese and Polish."]],
  muestra: 'Listen for 30 seconds',
  muestraPausa: 'Pause',
  muestraDe: 'The Sun Stone, at the National Museum of Anthropology',
  paradas: (n) => `${n} stops explained`,
  idiomas: '7 languages',
  sinSenal: 'Works offline',
  desde: (p) => `From ${p}`,
  gratisAhora: 'For a limited time, all tours are free.',
  telefonos: (n) => `${n} phones`,
  sitiosTitulo: 'Choose your site',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Combined passes',
  combosTexto: 'One payment for several sites, cheaper than buying them one by one.',
  combosIncluye: (n) => `${n} sites`,
  combosTodos: 'All sites',
  comoTitulo: 'How it works',
  caminata: 'Walk',
  gustoTitulo: "Enjoyed it? Unlock the rest of the stops",
  descargaAbierto: "Signal is often weak on site and in the streets. Download photos and audio before you leave.",
  descargaTodo: "Download the whole site",
  descargaRuta: "Download only the recommended route",
  gustoBoton: "See the 30-day pass",
  verParadas: "See stops",
  ocultarParadas: "Hide stops",
  region: { cdmx: 'Mexico City', edomex: 'State of Mexico', morelos: 'Morelos', yucatan: 'Yucatán' },
};

const fr: PortadaTexts = {
  promesa: "Le Mexique regorge d’histoires extraordinaires. Écoutez-les là où elles se sont déroulées.",
  promesaSub: "Découvrez musées, villes et sites archéologiques avec des audioguides qui vous racontent ce que vous voyez, à votre rythme, sans dépendre d’un groupe.",
  beneficios: [["Plus de 400 étapes soigneusement documentées", "De la Pierre du Soleil aux pyramides de Teotihuacan et de Chichén Itzá."], ["Vous choisissez le parcours", "Choisissez une salle ou une zone, ou suivez un parcours tout prêt. Pause, saut ou répétition à volonté."], ["Fonctionne sans internet", "Téléchargez le guide avant d’entrer et écoutez-le même sans réseau."], ["En 7 langues", "Espagnol, anglais, français, allemand, italien, portugais et polonais."]],
  muestra: 'Écouter 30 secondes',
  muestraPausa: 'Pause',
  muestraDe: 'La Pierre du Soleil, au Musée national d’anthropologie',
  paradas: (n) => `${n} étapes expliquées`,
  idiomas: '7 langues',
  sinSenal: 'Sans réseau',
  desde: (p) => `Dès ${p}`,
  gratisAhora: 'Pour une durée limitée, tous les parcours sont gratuits.',
  telefonos: (n) => `${n} téléphones`,
  sitiosTitulo: 'Choisissez votre site',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Pass combinés',
  combosTexto: 'Un seul paiement pour plusieurs sites, moins cher qu’à l’unité.',
  combosIncluye: (n) => `${n} sites`,
  combosTodos: 'Tous les sites',
  comoTitulo: 'Comment ça marche',
  caminata: 'Marche',
  gustoTitulo: "Ça vous a plu ? Débloquez les autres étapes",
  descargaAbierto: "Le réseau est souvent faible sur place et dans les rues. Téléchargez photos et audios avant de partir.",
  descargaTodo: "Télécharger tout le site",
  descargaRuta: "Télécharger seulement le parcours recommandé",
  gustoBoton: "Voir le pass de 30 jours",
  verParadas: "Voir les étapes",
  ocultarParadas: "Masquer les étapes",
  region: { cdmx: 'Mexico', edomex: 'État de Mexico', morelos: 'Morelos', yucatan: 'Yucatán' },
};

const pl: PortadaTexts = {
  promesa: "Meksyk ma niezwykłe historie. Posłuchaj ich tam, gdzie się wydarzyły.",
  promesaSub: "Odkrywaj muzea, miasta i stanowiska archeologiczne z audioprzewodnikami, które opowiadają o tym, co widzisz – w twoim tempie i bez grupy.",
  beneficios: [["Ponad 400 starannie opracowanych przystanków", "Od Kamienia Słońca po piramidy Teotihuacan i Chichén Itzá."], ["Ty wybierasz trasę", "Wybierz salę lub strefę albo gotową trasę. Zatrzymaj, pomiń lub powtórz, kiedy chcesz."], ["Działa bez internetu", "Pobierz przewodnik przed wejściem i słuchaj nawet bez zasięgu."], ["W 7 językach", "Hiszpański, angielski, francuski, niemiecki, włoski, portugalski i polski."]],
  muestra: 'Posłuchaj 30 sekund',
  muestraPausa: 'Pauza',
  muestraDe: 'Kamień Słońca w Narodowym Muzeum Antropologii',
  paradas: (n) => `${n} omówionych przystanków`,
  idiomas: '7 języków',
  sinSenal: 'Bez zasięgu',
  desde: (p) => `Od ${p}`,
  gratisAhora: 'Przez ograniczony czas wszystkie trasy są bezpłatne.',
  telefonos: (n) => `${n} telefony`,
  sitiosTitulo: 'Wybierz miejsce',
  pase: (p) => `Karnet ${p}`,
  combosTitulo: 'Karnety łączone',
  combosTexto: 'Jedna opłata za kilka miejsc, taniej niż osobno.',
  combosIncluye: (n) => `Miejsca: ${n}`,
  combosTodos: 'Wszystkie miejsca',
  comoTitulo: 'Jak to działa',
  caminata: 'Spacer',
  gustoTitulo: "Podobało się? Odblokuj pozostałe przystanki",
  descargaAbierto: "Na miejscu i na ulicach zasięg bywa słaby. Pobierz zdjęcia i nagrania przed wyjściem.",
  descargaTodo: "Pobierz całe miejsce",
  descargaRuta: "Pobierz tylko polecaną trasę",
  gustoBoton: "Zobacz karnet na 30 dni",
  verParadas: "Zobacz przystanki",
  ocultarParadas: "Ukryj przystanki",
  region: { cdmx: 'Miasto Meksyk', edomex: 'Stan Meksyk', morelos: 'Morelos', yucatan: 'Jukatan' },
};

const de: PortadaTexts = {
  promesa: "Mexiko hat außergewöhnliche Geschichten. Hör sie dort, wo sie geschehen sind.",
  promesaSub: "Entdecke Museen, Städte und archäologische Stätten mit Audioguides, die dir erzählen, was du gerade siehst – in deinem Tempo und ohne Gruppe.",
  beneficios: [["Mehr als 400 sorgfältig recherchierte Stationen", "Vom Sonnenstein bis zu den Pyramiden von Teotihuacan und Chichén Itzá."], ["Du bestimmst die Route", "Wähle einen Raum oder Bereich oder folge einer fertigen Tour. Pausieren, überspringen oder wiederholen, wann du willst."], ["Funktioniert ohne Internet", "Lade den Guide vor dem Eintritt herunter und hör ihn auch ohne Empfang."], ["In 7 Sprachen", "Spanisch, Englisch, Französisch, Deutsch, Italienisch, Portugiesisch und Polnisch."]],
  muestra: '30 Sekunden anhören',
  muestraPausa: 'Pause',
  muestraDe: 'Der Sonnenstein im Nationalmuseum für Anthropologie',
  paradas: (n) => `${n} erklärte Stationen`,
  idiomas: '7 Sprachen',
  sinSenal: 'Ohne Empfang',
  desde: (p) => `Ab ${p}`,
  gratisAhora: 'Für kurze Zeit sind alle Rundgänge kostenlos.',
  telefonos: (n) => `${n} Handys`,
  sitiosTitulo: 'Wähle deinen Ort',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Kombi-Pässe',
  combosTexto: 'Eine Zahlung für mehrere Orte, günstiger als einzeln.',
  combosIncluye: (n) => `${n} Orte`,
  combosTodos: 'Alle Orte',
  comoTitulo: 'So funktioniert es',
  caminata: 'Fußweg',
  gustoTitulo: "Gefallen? Schalte die übrigen Stationen frei",
  descargaAbierto: "Vor Ort und in den Straßen ist der Empfang oft schwach. Lade Fotos und Audios vor dem Losgehen herunter.",
  descargaTodo: "Den ganzen Ort herunterladen",
  descargaRuta: "Nur die empfohlene Route herunterladen",
  gustoBoton: "30-Tage-Pass ansehen",
  verParadas: "Stationen ansehen",
  ocultarParadas: "Stationen ausblenden",
  region: { cdmx: 'Mexiko-Stadt', edomex: 'Bundesstaat México', morelos: 'Morelos', yucatan: 'Yucatán' },
};

const pt: PortadaTexts = {
  promesa: "O México tem histórias extraordinárias. Ouça-as onde aconteceram.",
  promesaSub: "Descubra museus, cidades e sítios arqueológicos com audioguias que contam o que você está vendo, no seu ritmo e sem depender de um grupo.",
  beneficios: [["Mais de 400 paradas cuidadosamente documentadas", "Da Pedra do Sol às pirâmides de Teotihuacán e Chichén Itzá."], ["Você escolhe o roteiro", "Escolha uma sala ou uma zona, ou siga um roteiro pronto. Pause, pule ou repita quando quiser."], ["Funciona sem internet", "Baixe o guia antes de entrar e ouça mesmo sem sinal."], ["Em 7 idiomas", "Espanhol, inglês, francês, alemão, italiano, português e polonês."]],
  muestra: 'Ouça 30 segundos',
  muestraPausa: 'Pausar',
  muestraDe: 'A Pedra do Sol, no Museu Nacional de Antropologia',
  paradas: (n) => `${n} paradas explicadas`,
  idiomas: '7 idiomas',
  sinSenal: 'Sem sinal',
  desde: (p) => `A partir de ${p}`,
  gratisAhora: 'Por tempo limitado, todos os roteiros são grátis.',
  telefonos: (n) => `${n} celulares`,
  sitiosTitulo: 'Escolha seu local',
  pase: (p) => `Passe ${p}`,
  combosTitulo: 'Passes combinados',
  combosTexto: 'Um único pagamento para vários locais, mais barato que separados.',
  combosIncluye: (n) => `${n} locais`,
  combosTodos: 'Todos os locais',
  comoTitulo: 'Como funciona',
  caminata: 'Caminhada',
  gustoTitulo: "Gostou? Desbloqueie as demais paradas",
  descargaAbierto: "No local e nas ruas o sinal costuma ser fraco. Baixe fotos e áudios antes de sair.",
  descargaTodo: "Baixar o local inteiro",
  descargaRuta: "Baixar só o roteiro recomendado",
  gustoBoton: "Ver o passe de 30 dias",
  verParadas: "Ver paradas",
  ocultarParadas: "Ocultar paradas",
  region: { cdmx: 'Cidade do México', edomex: 'Estado do México', morelos: 'Morelos', yucatan: 'Iucatã' },
};

const it: PortadaTexts = {
  promesa: "Il Messico ha storie straordinarie. Ascoltale dove sono accadute.",
  promesaSub: "Scopri musei, città e siti archeologici con audioguide che ti raccontano ciò che stai guardando, con i tuoi tempi e senza dipendere da un gruppo.",
  beneficios: [["Oltre 400 tappe accuratamente documentate", "Dalla Pietra del Sole alle piramidi di Teotihuacan e Chichén Itzá."], ["Scegli tu il percorso", "Scegli una sala o una zona, o segui un percorso già pronto. Pausa, salta o ripeti quando vuoi."], ["Funziona senza internet", "Scarica la guida prima di entrare e ascoltala anche senza rete."], ["In 7 lingue", "Spagnolo, inglese, francese, tedesco, italiano, portoghese e polacco."]],
  muestra: 'Ascolta 30 secondi',
  muestraPausa: 'Pausa',
  muestraDe: 'La Pietra del Sole, al Museo Nazionale di Antropologia',
  paradas: (n) => `${n} tappe spiegate`,
  idiomas: '7 lingue',
  sinSenal: 'Senza campo',
  desde: (p) => `Da ${p}`,
  gratisAhora: 'Per un periodo limitato, tutti i percorsi sono gratuiti.',
  telefonos: (n) => `${n} telefoni`,
  sitiosTitulo: 'Scegli il tuo sito',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Pass combinati',
  combosTexto: 'Un solo pagamento per più siti, più conveniente che separati.',
  combosIncluye: (n) => `${n} siti`,
  combosTodos: 'Tutti i siti',
  comoTitulo: 'Come funziona',
  caminata: 'Camminata',
  gustoTitulo: "Ti è piaciuto? Sblocca le altre tappe",
  descargaAbierto: "Sul posto e per strada il campo è spesso debole. Scarica foto e audio prima di uscire.",
  descargaTodo: "Scarica tutto il sito",
  descargaRuta: "Scarica solo il percorso consigliato",
  gustoBoton: "Vedi il pass da 30 giorni",
  verParadas: "Vedi le tappe",
  ocultarParadas: "Nascondi le tappe",
  region: { cdmx: 'Città del Messico', edomex: 'Stato del Messico', morelos: 'Morelos', yucatan: 'Yucatán' },
};

const TEXTOS: Partial<Record<SupportedLanguage, PortadaTexts>> = { es, en, fr, pl, de, pt, it };

export const portadaTexts = (lang: SupportedLanguage): PortadaTexts => TEXTOS[lang] || es;

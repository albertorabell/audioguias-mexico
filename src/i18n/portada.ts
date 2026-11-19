import type { SupportedLanguage } from './languages';

/**
 * Textos de la portada (pantalla de inicio): promesa, botón de muestra, franja de datos, regiones y pases combinados.
 * Un idioma sin traducción usa el español.
 */
export interface PortadaTexts {
  promesa: string;
  promesaSub: string;
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
  promesa: 'Escucha la historia frente a lo que estás viendo.',
  promesaSub: 'Sin grupo, sin señal, en 7 idiomas.',
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
  promesa: 'Hear the story right in front of what you are looking at.',
  promesaSub: 'No group, no signal needed, in 7 languages.',
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
  promesa: 'Écoutez l’histoire juste devant ce que vous regardez.',
  promesaSub: 'Sans groupe, sans réseau, en 7 langues.',
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
  promesa: 'Posłuchaj historii tuż przed tym, na co patrzysz.',
  promesaSub: 'Bez grupy, bez zasięgu, w 7 językach.',
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
  promesa: 'Hör die Geschichte genau vor dem, was du siehst.',
  promesaSub: 'Ohne Gruppe, ohne Empfang, in 7 Sprachen.',
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
  promesa: 'Ouça a história bem diante do que você está vendo.',
  promesaSub: 'Sem grupo, sem sinal, em 7 idiomas.',
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
  promesa: 'Ascolta la storia proprio davanti a ciò che stai guardando.',
  promesaSub: 'Senza gruppo, senza campo, in 7 lingue.',
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

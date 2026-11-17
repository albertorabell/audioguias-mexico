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
  telefonos: (n) => `${n} teléfonos`,
  sitiosTitulo: 'Elige tu sitio',
  pase: (p) => `Pase ${p}`,
  combosTitulo: 'Pases combinados',
  combosTexto: 'Un solo pago para varios sitios, más barato que por separado.',
  combosIncluye: (n) => `${n} sitios`,
  combosTodos: 'Todos los sitios',
  comoTitulo: 'Cómo funciona',
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
  telefonos: (n) => `${n} phones`,
  sitiosTitulo: 'Choose your site',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Combined passes',
  combosTexto: 'One payment for several sites, cheaper than buying them one by one.',
  combosIncluye: (n) => `${n} sites`,
  combosTodos: 'All sites',
  comoTitulo: 'How it works',
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
  telefonos: (n) => `${n} téléphones`,
  sitiosTitulo: 'Choisissez votre site',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Pass combinés',
  combosTexto: 'Un seul paiement pour plusieurs sites, moins cher qu’à l’unité.',
  combosIncluye: (n) => `${n} sites`,
  combosTodos: 'Tous les sites',
  comoTitulo: 'Comment ça marche',
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
  telefonos: (n) => `${n} telefony`,
  sitiosTitulo: 'Wybierz miejsce',
  pase: (p) => `Karnet ${p}`,
  combosTitulo: 'Karnety łączone',
  combosTexto: 'Jedna opłata za kilka miejsc, taniej niż osobno.',
  combosIncluye: (n) => `Miejsca: ${n}`,
  combosTodos: 'Wszystkie miejsca',
  comoTitulo: 'Jak to działa',
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
  telefonos: (n) => `${n} Handys`,
  sitiosTitulo: 'Wähle deinen Ort',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Kombi-Pässe',
  combosTexto: 'Eine Zahlung für mehrere Orte, günstiger als einzeln.',
  combosIncluye: (n) => `${n} Orte`,
  combosTodos: 'Alle Orte',
  comoTitulo: 'So funktioniert es',
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
  telefonos: (n) => `${n} celulares`,
  sitiosTitulo: 'Escolha seu local',
  pase: (p) => `Passe ${p}`,
  combosTitulo: 'Passes combinados',
  combosTexto: 'Um único pagamento para vários locais, mais barato que separados.',
  combosIncluye: (n) => `${n} locais`,
  combosTodos: 'Todos os locais',
  comoTitulo: 'Como funciona',
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
  telefonos: (n) => `${n} telefoni`,
  sitiosTitulo: 'Scegli il tuo sito',
  pase: (p) => `Pass ${p}`,
  combosTitulo: 'Pass combinati',
  combosTexto: 'Un solo pagamento per più siti, più conveniente che separati.',
  combosIncluye: (n) => `${n} siti`,
  combosTodos: 'Tutti i siti',
  comoTitulo: 'Come funziona',
  region: { cdmx: 'Città del Messico', edomex: 'Stato del Messico', morelos: 'Morelos', yucatan: 'Yucatán' },
};

const TEXTOS: Partial<Record<SupportedLanguage, PortadaTexts>> = { es, en, fr, pl, de, pt, it };

export const portadaTexts = (lang: SupportedLanguage): PortadaTexts => TEXTOS[lang] || es;

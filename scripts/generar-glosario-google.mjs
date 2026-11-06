// Crea/actualiza glosario/pronunciacion-google.csv a partir de las palabras que el glosario de Azure manda leer en español
// (filas "lang es-MX=…") más las filas ipa de todos los idiomas. No sobrescribe filas que ya existan (corrígelas a mano).
// Uso: node scripts/generar-glosario-google.mjs
import fs from 'node:fs';
import { loadPronunciations, PRONUNCIATION_FILE } from './pronunciacion-lib.mjs';
import { toIpa, GOOGLE_IPA_FILE, loadGoogleIpa } from './google-ipa-lib.mjs';

const SKIP = /sugiyama|linda|naranja|batres|popol|quinto sol/i; // nombres no mexicanos / con lectura propia: se revisan aparte
const existing = loadGoogleIpa();
const words = new Set();
for (const e of loadPronunciations(PRONUNCIATION_FILE)) {
  if (e.kind === 'lang' && e.value.startsWith('es-MX=')) words.add(e.word);
  if (e.kind === 'ipa') words.add(e.word);
}
const rows = [...words].filter((w) => !SKIP.test(w)).sort((a, b) => a.localeCompare(b, 'es'));
const lines = ['# Cómo suena cada nombre en Google (voz Chirp 3 HD), en fonética IPA de español de México. Vale para todos los idiomas.', '# Corrige una fila a mano si suena mal; el generador no la pisa. Después hay que regenerar los audios que tengan esa palabra (--forzar).', 'palabra,ipa'];
for (const w of rows) lines.push(`${w},${existing.get(w.toLowerCase())?.ipa || toIpa(w)}`);
fs.writeFileSync(GOOGLE_IPA_FILE, lines.join('\n') + '\n');
console.log(`${rows.length} palabras → ${GOOGLE_IPA_FILE}`);

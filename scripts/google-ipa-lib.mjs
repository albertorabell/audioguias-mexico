// scripts/google-ipa-lib.mjs
//
// Pronunciación para Google Chirp 3 HD: nombres mexicanos (nahuas, mayas, españoles) leídos como los diría un mexicano
// aunque el texto esté en otro idioma. Se escribe en fonética (IPA) dentro de SSML: <phoneme alphabet="ipa" ph="…">.
// El archivo glosario/pronunciacion-google.csv (palabra,ipa) se genera con scripts/generar-glosario-google.mjs y se puede
// corregir a mano.

import fs from 'node:fs';

export const GOOGLE_IPA_FILE = 'glosario/pronunciacion-google.csv';
const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function loadGoogleIpa(file = GOOGLE_IPA_FILE) {
  if (!fs.existsSync(file)) return new Map();
  const map = new Map();
  for (const l of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    if (!l.trim() || l.startsWith('#') || l.startsWith('palabra,')) continue;
    const i = l.indexOf(',');
    const w = l.slice(0, i).trim();
    const ipa = l.slice(i + 1).split(',')[0].trim();
    if (w && ipa) map.set(w.toLowerCase(), { word: w, ipa });
  }
  return map;
}

/** Texto → SSML de Google con <phoneme> en las palabras del glosario (palabras completas, sin importar mayúsculas). */
export function toGoogleSsml(text, map, { plain = false } = {}) {
  if (plain || !map.size) return `<speak>${xmlEscape(text)}</speak>`;
  const words = [...map.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escapeRe).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  let out = '';
  let last = 0;
  for (const m of text.matchAll(re)) {
    out += xmlEscape(text.slice(last, m.index));
    out += `<phoneme alphabet="ipa" ph="${xmlEscape(map.get(m[1].toLowerCase()).ipa)}">${xmlEscape(m[1])}</phoneme>`;
    last = m.index + m[1].length;
  }
  return `<speak>${out}${xmlEscape(text.slice(last))}</speak>`;
}

// ---------------------------------------------------------------------------
// Conversor ortografía → IPA (español de México, con las reglas de los nombres nahuas y mayas)
// ---------------------------------------------------------------------------
const VOW = 'aeiouáéíóú';
const STRONG = 'aeoáéó';
const isV = (c) => c && VOW.includes(c);

// Excepciones: palabras cuya x suena como j / s, o que no siguen la regla
const EXC = {
  méxico: 'ˈme.xi.ko', mexico: 'ˈme.xi.ko', oaxaca: 'wa.ˈxa.ka', oaxaqueño: 'wa.xa.ˈke.ɲo', texcoco: 'tes.ˈko.ko', mexica: 'me.ˈʃi.ka', mexicas: 'me.ˈʃi.kas',
  mool: 'ˈmol', 'chac mool': 'ˈtʃak ˈmol', chaacmol: 'tʃak.ˈmol', mixtecas: 'mis.ˈte.kas', mixteca: 'mis.ˈte.ka', mixe: 'ˈmi.xe', tuxtlas: 'ˈtuks.tlas', tuxpan: 'ˈtuks.pan',
  uxmal: 'uʃ.ˈmal', 'el tajín': 'el ta.ˈxin', tajín: 'ta.ˈxin', ajusco: 'a.ˈxus.ko', jaina: 'ˈxai.na', janitzio: 'xa.ˈni.tsjo', jarácuaro: 'xa.ˈɾa.kwa.ɾo',
  juchitepec: 'xu.tʃi.te.ˈpek', ejutla: 'e.ˈxu.tla', chihuahua: 'tʃi.ˈwa.wa', 'popol vuh': 'ˈpo.pol ˈbuh', 'quinto sol': 'ˈkin.to ˈsol',
  wirikuta: 'wi.ɾi.ˈku.ta', wixárika: 'wi.ˈsa.ɾi.ka', wixáritari: 'wi.ˈsa.ɾi.ta.ɾi', huichol: 'wi.ˈtʃol', witz: 'ˈwits', yaquis: 'ˈja.kis', 'sigüenza y góngora': 'si.ˈɣwen.sa i ˈɣoŋ.go.ɾa',
};
const LETTER = { b: 'b', v: 'b', d: 'd', f: 'f', k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', s: 's', t: 't', w: 'w', z: 's', ñ: 'ɲ', q: 'k', j: 'x', g: 'g', c: 'k', r: 'ɾ', y: 'j', h: '', x: 'ʃ' };

function g2pWord(raw) {
  let w = raw.toLowerCase();
  if (EXC[w]) return EXC[w];
  w = w.replace(/aa/g, 'a').replace(/ee/g, 'e').replace(/oo/g, 'o').replace(/uu/g, 'u').replace(/ü/g, 'ü');
  // 1) letras → símbolos (cada símbolo es [texto, esVocal, acentuada])
  const sy = [];
  const push = (p, v = false, st = false) => sy.push({ p, v, st });
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1], n2 = w[i + 2], prev = w[i - 1];
    if (c === 't' && n === 'z') { push('ts'); i++; continue; }
    if (c === 't' && n === 'l') { if (i === 0 || i + 2 >= w.length) push('tl'); else { push('t'); push('l'); } i++; continue; } // tl al inicio/final = una sola unidad; en medio, t + l (tit.lan)
    if (c === 'c' && n === 'h') { push('tʃ'); i++; continue; }
    if (c === 'l' && n === 'l') { push('j'); i++; continue; }
    if (c === 'r' && n === 'r') { push('r'); i++; continue; }
    if (c === 'q' && n === 'u') { push('k'); i++; continue; }
    if (c === 'g' && n === 'u' && n2 && 'eiéí'.includes(n2)) { push('g'); i++; continue; }
    if (c === 'g' && n === 'ü') { push('g'); push('w'); i++; continue; }
    if (c === 'k' && n === 'h') { push('x'); i++; continue; }
    if (c === 'c' && n && 'eiéí'.includes(n)) { push('s'); continue; }
    if (c === 'g' && n && 'eiéí'.includes(n)) { push('x'); continue; }
    if (c === 'h') continue; // muda (hua → wa se resuelve con la u)
    if (c === 'r') { push(i === 0 || 'nls'.includes(prev || '') ? 'r' : 'ɾ'); continue; }
    if (c === 'u' && prev === 'h' && isV(n)) { push('w'); continue; }
    if (c === 'u' && prev === 'c' && isV(n) && (i === 1 || true)) { push('w'); continue; } // cua, cue, cuo
    if (c === 'u' && prev === 'g' && isV(n)) { push('w'); continue; }
    if (c === 'u' && n === 'h' && isV(prev) && !isV(w[i + 2])) { push('w'); continue; } // auh → aw
    if ('aeiouáéíóú'.includes(c)) {
      const acc = 'áéíóú'.includes(c);
      const base = 'áéíóú'.includes(c) ? 'aeiou'['áéíóú'.indexOf(c)] : c;
      // i/u débiles sin acento junto a otra vocal → semivocal
      const weak = (c === 'i' || c === 'u');
      if (weak && isV(n) && !'áéíóú'.includes(n) && false) {}
      push(base, true, acc);
      sy[sy.length - 1].weak = weak;
      continue;
    }
    if (c === 'x') { push('ʃ'); continue; }
    if (LETTER[c] !== undefined) { if (LETTER[c]) push(LETTER[c]); continue; }
    push(c);
  }
  // 2) semivocales: i/u débil junto a vocal fuerte → parte del mismo núcleo (diptongo) o consonante si va antes
  const out = [];
  for (let i = 0; i < sy.length; i++) {
    const s = sy[i];
    if (s.v && s.weak && !s.st) {
      const nx = sy[i + 1], pv = out[out.length - 1];
      if (nx && nx.v && (nx.weak ? nx.st : true) && !(pv && pv.v && !pv.glide)) { out.push({ p: s.p === 'i' ? 'j' : 'w', v: false }); continue; } // sube a consonante: ia, ie, ua…
      if (pv && pv.v && !pv.glide && !(nx && nx.v)) { out.push({ p: s.p === 'i' ? 'j' : 'w', v: false, glide: true, off: true }); continue; } // ai, au, ei…
    }
    out.push(s);
  }
  // 3) núcleos: vocal + semivocal final
  const nuclei = [];
  const units = [];
  for (let i = 0; i < out.length; i++) {
    const s = out[i];
    if (s.off) { units[units.length - 1].p += s.p; continue; }
    units.push({ ...s });
  }
  const idxV = units.map((u, i) => (u.v ? i : -1)).filter((i) => i >= 0);
  if (!idxV.length) return units.map((u) => u.p).join('');
  // 4) sílabas: la consonante simple va con la vocal siguiente; en grupos, las dos últimas si son (oclusiva|f)+(l|ɾ) o una africada ya unida
  const onsetOk = (a, b) => 'pbtdkgf'.includes(a) && a.length === 1 && ('lɾ'.includes(b) || (b === 'w' && 'kg'.includes(a)));
  const starts = [0];
  for (let k = 1; k < idxV.length; k++) {
    const a = idxV[k - 1], b = idxV[k];
    const cons = units.slice(a + 1, b).map((u) => u.p);
    let cut;
    if (cons.length === 0) cut = b;
    else if (cons.length === 1) cut = b - 1;
    else if (cons.length === 2) cut = onsetOk(cons[0], cons[1]) && !(cons[0] === 't' && cons[1] === 'l') ? b - 2 : b - 1;
    else cut = onsetOk(cons[cons.length - 2], cons[cons.length - 1]) ? b - 2 : b - 1;
    starts.push(cut);
  }
  const syl = starts.map((s, k) => units.slice(s, starts[k + 1] ?? units.length));
  // 5) acento: sílaba marcada; si no hay, llana (vocal/n/s) o aguda
  let st = syl.findIndex((sl) => sl.some((u) => u.st));
  if (st < 0) {
    const last = units[units.length - 1];
    const aguda = !(last.v || ['n', 's'].includes(last.p) || last.p === 'tl' || last.p.endsWith('j') || last.p.endsWith('w')) ;
    // palabras que terminan en -tl llevan el golpe en la penúltima (Nahuatl): tenoch-TIT-lan, no cambia; -atl, -itl, -otl son llanas
    st = syl.length === 1 ? 0 : aguda ? syl.length - 1 : syl.length - 2;
  }
  return syl.map((sl, k) => (k === st && syl.length > 1 ? 'ˈ' : '') + sl.map((u) => u.p).join('')).join('.').replace('.ˈ', '.ˈ');
}

/** Frase (varias palabras) → IPA. Las palabras de enlace (de, del, la, los, el, y) se leen en español. */
export function toIpa(phrase) {
  const lower = phrase.toLowerCase();
  if (EXC[lower]) return EXC[lower];
  const small = { de: 'de', del: 'del', la: 'la', los: 'los', el: 'el', y: 'i', las: 'las' };
  return phrase.split(/\s+/).map((w) => small[w.toLowerCase()] || g2pWord(w)).join(' ');
}

// Enlaces entre piezas dentro de los textos.
//
// En el Sheets los guiones (guion_corto y guion_largo) pueden llevar enlaces escritos así:
//     [Disco de la Muerte](mna_s04_disco_muerte)
// El texto entre corchetes es lo que se lee; lo que va entre paréntesis es el piece_id de la pieza a la que lleva.
//
// Este archivo lo usan la app (src/) y los scripts (scripts/) para que los dos entiendan igual la marca:
//  - la app dibuja el texto como enlace y abre una ventanita con esa pieza;
//  - la voz, la huella de los MP3, el adelanto público y el índice de búsqueda usan SOLO el texto visible.
// Es JavaScript simple (con JSDoc) a propósito: lo leen tanto Vite/TypeScript como Node sin compilar nada.

/** Un enlace: [texto visible](piece_id). El id empieza con letra y solo lleva minúsculas, números y guion bajo. */
export const LINK_PATTERN = '\\[([^\\[\\]\\n]+)\\]\\(([a-z][a-z0-9_]*)\\)';

const newRe = () => new RegExp(LINK_PATTERN, 'g');

/**
 * Quita la marca y deja el texto visible: "viste el [Disco](mna_x)" → "viste el Disco".
 * @param {unknown} text
 * @returns {string}
 */
export function stripLinks(text) {
  return String(text ?? '').replace(newRe(), '$1');
}

/**
 * Parte el texto en trozos: texto suelto ({ text }) y enlaces ({ text, id }).
 * @param {unknown} text
 * @returns {{ text: string, id?: string }[]}
 */
export function splitLinks(text) {
  const s = String(text ?? '');
  const out = [];
  let pos = 0;
  for (const m of s.matchAll(newRe())) {
    const at = m.index ?? 0;
    if (at > pos) out.push({ text: s.slice(pos, at) });
    out.push({ text: m[1], id: m[2] });
    pos = at + m[0].length;
  }
  if (pos < s.length) out.push({ text: s.slice(pos) });
  return out;
}

/**
 * Los ids de los enlaces, en el orden en que aparecen (con repetidos).
 * @param {unknown} text
 * @returns {string[]}
 */
export function linkIds(text) {
  return [...String(text ?? '').matchAll(newRe())].map((m) => m[2]);
}

/**
 * ¿Hay corchetes o paréntesis que parecen un enlace roto? (por ejemplo "[texto] (id)" o "[texto](Id)").
 * Sirve para avisar en la sincronización y en el traductor.
 * @param {unknown} text
 * @returns {boolean}
 */
export function hasBrokenLink(text) {
  const rest = String(text ?? '').replace(newRe(), '');
  return /\]\s*\(|\[[^\]\n]*\]/.test(rest);
}

/**
 * Una traducción conserva los enlaces si lleva los mismos ids, en el mismo número.
 * (El texto visible sí cambia: se traduce. El orden puede cambiar porque cada idioma ordena distinto.)
 * @param {unknown} original
 * @param {unknown} translated
 * @returns {boolean}
 */
export function sameLinks(original, translated) {
  const a = linkIds(original).sort();
  const b = linkIds(translated).sort();
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

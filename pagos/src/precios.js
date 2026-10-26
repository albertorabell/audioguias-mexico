// Precios y forma de acceso de cada sitio.
//
// La fuente de verdad es la hoja CONTROL (pestañas SITIOS y PASE_COMBINADO). La sincronización del sitio las publica
// como data/precios.json, y este servidor lo lee de ahí (PRECIOS_URL) para saber cuánto cobrar y qué sitios existen.
// Así el precio que se ve en la app y el que se cobra salen siempre del mismo lugar.
//
// Formato de precios.json:
//   { "sites": { "mna": { "prefijo": "mna_", "nombre": "…", "acceso": "pago|gratis|codigo", "mxn": 99, "usd": 6 } },
//     "combos": { "centro": { "nombre": { "es": "…", "en": "…" }, "sitios": ["centro_historico", "templo_mayor_catedral"] | "todos", "mxn": 139, "usd": 8 } } }
//
// Un pase combinado abre varios sitios a la vez. Su id ("centro") es el «sitio» que lleva la clave del pase; "todos" abre cualquier sitio.
//
// Si no hay PRECIOS_URL o el archivo no se puede leer ni hay una copia reciente, el servidor sigue como antes:
// un solo precio de Stripe (STRIPE_PRICE_ID_*) y la lista fija SITE_IDS.

export const COMBO = 'todos';

const SITE_RE = /^[a-z0-9_]{2,40}$/;
const PREFIX_RE = /^[a-z0-9]{1,12}_$/;
const ACCESS = new Set(['pago', 'gratis', 'codigo']);
const TTL_MS = 300_000;

const amount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 100_000 ? Math.round(n * 100) / 100 : null;
};
const text = (v) => (typeof v === 'string' ? v.trim().slice(0, 120) : '');

/** Valida y limpia el archivo. Devuelve null si no sirve (nada de lo que traiga se usa a ciegas). */
export function parsePrecios(raw) {
  if (!raw || typeof raw !== 'object' || !raw.sites || typeof raw.sites !== 'object') return null;
  const sites = {};
  const prefixes = new Set();
  for (const [id, s] of Object.entries(raw.sites)) {
    const key = String(id).toLowerCase();
    if (!SITE_RE.test(key) || key === COMBO || !s || typeof s !== 'object') continue;
    const prefijo = String(s.prefijo || '').toLowerCase();
    if (!PREFIX_RE.test(prefijo) || prefixes.has(prefijo)) continue;
    prefixes.add(prefijo);
    sites[key] = {
      prefijo,
      nombre: text(s.nombre) || key,
      acceso: ACCESS.has(s.acceso) ? s.acceso : 'pago',
      mxn: amount(s.mxn),
      usd: amount(s.usd),
    };
  }
  if (!Object.keys(sites).length) return null;
  const combos = {};
  for (const [id, c] of Object.entries(raw.combos && typeof raw.combos === 'object' ? raw.combos : {})) {
    const key = String(id).toLowerCase();
    if (!SITE_RE.test(key) || sites[key] || !c || typeof c !== 'object' || !amount(c.mxn)) continue;
    const names = c.nombre && typeof c.nombre === 'object' ? c.nombre : { es: c.nombre };
    const nombre = {};
    for (const l of ['es', 'en', 'fr', 'pl']) if (text(names[l])) nombre[l] = text(names[l]);
    // "todos" = cualquier sitio; si no, solo cuentan los sitios que existen en la tabla
    const list = c.sitios === 'todos' ? 'todos' : (Array.isArray(c.sitios) ? c.sitios : []).map((x) => String(x).toLowerCase()).filter((x) => sites[x]);
    if (list !== 'todos' && list.length < 1) continue;
    if (key === COMBO && list !== 'todos') continue; // "todos" siempre significa todos
    combos[key] = { nombre: { es: nombre.es || key, ...nombre }, sitios: list === 'todos' ? 'todos' : [...new Set(list)], mxn: amount(c.mxn), usd: amount(c.usd) };
  }
  return { sites, combos };
}

/** ¿Un pase de ese «sitio» (un sitio o un pase combinado) abre este sitio? "todos" abre cualquiera, aunque el combo ya no esté en la tabla. */
export function coversSite(table, passSite, site) {
  if (passSite === site || passSite === COMBO) return true;
  const c = table?.combos[passSite];
  return Boolean(c) && (c.sitios === 'todos' || c.sitios.includes(site));
}

/** Lo que abre un pase, para que la app lo recuerde: ["todos"] o la lista de sitios. */
export function coverageOf(table, passSite) {
  if (passSite === COMBO) return [COMBO];
  const c = table?.combos[passSite];
  if (!c) return [passSite];
  return c.sitios === 'todos' ? [COMBO] : [...c.sitios];
}

let cache = { at: 0, url: '', data: null };

/** La tabla vigente, o null si no hay (se usa entonces la configuración fija). Aguanta fallos pasajeros usando la última copia buena. */
export async function getPrecios(env) {
  const url = String(env.PRECIOS_URL || '').trim();
  if (!url) return null;
  if (cache.url === url && cache.data && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const res = await fetch(url, { cf: { cacheTtl: 120, cacheEverything: true } });
    if (res.ok) {
      const parsed = parsePrecios(await res.json());
      if (parsed) {
        cache = { at: Date.now(), url, data: parsed };
        return parsed;
      }
    }
  } catch {
    /* sin red o archivo roto: se usa la última copia buena, si hay */
  }
  return cache.url === url ? cache.data : null;
}

/** Solo para pruebas. */
export function resetPreciosCache() {
  cache = { at: 0, url: '', data: null };
}

/** Sitio al que pertenece una pieza, según el prefijo de su id ("mna_s06_piedra_sol" → "mna"). Gana el prefijo más largo. */
export function siteForPiece(table, pieceId) {
  if (!table) return null;
  const id = String(pieceId || '').toLowerCase();
  let best = null;
  for (const [site, s] of Object.entries(table.sites)) {
    if (id.startsWith(s.prefijo) && (!best || s.prefijo.length > table.sites[best].prefijo.length)) best = site;
  }
  return best;
}

// Direcciones reales de la app: /sitio/<sitio> y /sitio/<sitio>/<parada>. Los enlaces viejos (?sitio=MNA&idioma=en) siguen funcionando.
// Sin dependencias, para poder probarlo con node --test.

export const DOMINIO = 'https://xolotli.com';

/** Lee /sitio/<sitio>[/<parada>] de una ruta. Devuelve null si no es una dirección de sitio. */
export function leerRuta(pathname) {
  const m = /^\/sitio\/([^/]+)(?:\/([^/]+))?\/?$/.exec(String(pathname || ''));
  if (!m) return null;
  try {
    const sitio = decodeURIComponent(m[1]).trim();
    const parada = m[2] ? decodeURIComponent(m[2]).trim() : '';
    if (!/^[A-Za-z0-9_-]{1,60}$/.test(sitio) || (parada && !/^[A-Za-z0-9_.-]{1,120}$/.test(parada))) return null;
    return { sitio, parada };
  } catch {
    return null;
  }
}

/** Ruta de un sitio (y de una parada si se da). Sin sitio: la raíz. */
export function rutaDe(sitioId, paradaId = '') {
  if (!sitioId) return '/';
  const base = `/sitio/${encodeURIComponent(String(sitioId).toLowerCase())}`;
  return paradaId ? `${base}/${encodeURIComponent(paradaId)}` : base;
}

/**
 * Dirección canónica (la «oficial» para Google) de una ruta de la app.
 * Las páginas de /guias/ son las que se indexan: /sitio/<sitio> declara como oficial la guía de ese sitio, y
 * /sitio/<sitio>/<parada> la página de la parada si es gratis (si no, la guía del sitio: las de pago no tienen página).
 * `mapa` es data/guias.json; sin él (o para un sitio sin guía) cada dirección es su propia canónica.
 *
 * @param {string} pathname
 * @param {{ sitios?: Record<string, string>, paradas?: Record<string, string> } | null} [mapa]
 */
export function canonicaDe(pathname, mapa = null) {
  const r = leerRuta(pathname);
  if (!r) return `${DOMINIO}/`;
  const id = r.sitio.toLowerCase();
  const parada = r.parada && mapa?.paradas?.[`${id}/${r.parada}`];
  if (parada) return `${DOMINIO}${parada}`;
  const guia = mapa?.sitios?.[id];
  if (guia) return `${DOMINIO}${guia}`;
  return `${DOMINIO}${rutaDe(r.sitio, r.parada)}`;
}

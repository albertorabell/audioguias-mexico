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

/** Dirección canónica (la que debe declarar la página para Google) de una ruta. */
export function canonicaDe(pathname) {
  const r = leerRuta(pathname);
  return r ? `${DOMINIO}${rutaDe(r.sitio, r.parada)}` : `${DOMINIO}/`;
}

// Aliados (hoteles, Airbnb, tours): la dirección xolotli.com/h/<slug> trae el descuento de ese aliado.
// Se guarda en el navegador 30 días para que la compra se le atribuya aunque la persona vuelva después.
const KEY = 'xolo_aliado';
const MAX_AGE_MS = 30 * 24 * 3600 * 1000;
const SLUG_RE = /^[a-z0-9_-]{2,20}$/;

/** "/h/presidente" o "/h/Presidente/" → "presidente". Cualquier otra ruta → ''. */
export function slugDeRuta(pathname) {
  const m = /^\/h\/([^/]+)\/?$/i.exec(String(pathname || ''));
  const slug = m ? m[1].toLowerCase() : '';
  return SLUG_RE.test(slug) ? slug : '';
}

export function guardarAliado(a) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ slug: a.slug, nombre: a.nombre, percentOff: a.percentOff, at: Date.now() }));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function aliadoGuardado() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v || !SLUG_RE.test(v.slug || '') || !v.at || Date.now() - v.at > MAX_AGE_MS) {
      if (v) localStorage.removeItem(KEY);
      return null;
    }
    return { slug: v.slug, nombre: String(v.nombre || v.slug), percentOff: Number(v.percentOff) || 0 };
  } catch {
    return null;
  }
}

export function olvidarAliado() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
}

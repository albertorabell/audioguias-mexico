// Lista de sitios (museos y zonas). La fuente de verdad es la hoja CONTROL (pestaña SITIOS) de la carpeta
// "Audioguías México" en Drive. Si no hay clave del robot (por ejemplo en pruebas locales), se usa una lista fija.
import { hayClave, leerPestana } from './google-sheets-lib.mjs';

export const CONTROL_ID = process.env.CONTROL_SHEET_ID || '1e4BQCAULQq6zABdMTD0trSpuzknPTV3ZS9gzp6Qx93Q';

// Solo se usa si no se puede leer CONTROL.
const SITIOS_RESPALDO = [
  { site_id: 'mna', prefijo: 'mna_', nombre: 'Museo Nacional de Antropología', sheet_id: '', publicar: 'SI' },
  { site_id: 'teotihuacan', prefijo: 'teo_', nombre: 'Zona Arqueológica de Teotihuacán', sheet_id: '', publicar: 'SI' },
];

let cache = null;

/** Devuelve la lista de sitios como objetos { site_id, prefijo, nombre, sheet_id, publicar, idiomas, precio_mxn, estado, notas }. */
export async function cargarSitios({ estricto = false } = {}) {
  if (cache) return cache;
  if (!hayClave()) {
    if (estricto) throw new Error('Falta el secreto GOOGLE_SERVICE_ACCOUNT_JSON para leer la hoja CONTROL.');
    return (cache = SITIOS_RESPALDO);
  }
  const rows = await leerPestana(CONTROL_ID, 'SITIOS');
  const [head, ...resto] = rows;
  const h = (head || []).map((x) => x.trim());
  const sitios = resto
    .filter((r) => r.some((v) => String(v).trim()))
    .map((r) => Object.fromEntries(h.map((k, i) => [k, String(r[i] ?? '').trim()])))
    .filter((s) => s.site_id)
    .filter((s) => {
      // El site_id se usa como nombre de carpeta y de archivo: solo minúsculas, números y guion bajo.
      if (/^[a-z0-9_]{2,40}$/.test(s.site_id)) return true;
      console.warn(`::warning title=CONTROL: site_id inválido::Se omite «${s.site_id.slice(0, 60)}» (solo minúsculas, números y _).`);
      return false;
    });
  if (!sitios.length) throw new Error('La hoja CONTROL (pestaña SITIOS) no tiene sitios.');
  return (cache = sitios);
}

export const estaPublicado = (s) => String(s.publicar || '').trim().toUpperCase() === 'SI';

/** Prefijo de los ids de un sitio ("mna_"). Devuelve '' si el sitio es "todos". Lanza error si el sitio no existe. */
export async function prefijoDeSitio(siteId) {
  if (!siteId || siteId === 'todos' || siteId === 'todo') return '';
  const s = (await cargarSitios()).find((x) => x.site_id === siteId);
  if (!s) throw new Error(`El sitio "${siteId}" no existe en CONTROL. Sitios: ${(await cargarSitios()).map((x) => x.site_id).join(', ')}`);
  if (!s.prefijo) throw new Error(`El sitio "${siteId}" no tiene prefijo en CONTROL.`);
  return s.prefijo;
}

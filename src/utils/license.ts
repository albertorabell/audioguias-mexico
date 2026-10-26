import { SiteLicense } from '../types';
import { PASS_HOURS } from '../config/pass';

const STORAGE_KEY_PREFIX = 'audioguias_pass_';
const DEVICE_ID_KEY = 'audioguias_device_id';
const MNA_TOUR_PASS_KEY = 'mna_tour_pass_active';
const MNA_TOUR_EXPIRES_KEY = 'mna_tour_pass_expires';

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'temp_device_fallback';
  }
}

const FREE_KEY = 'audioguias_acceso_libre';
const FREE_TOKEN = 'libre';
const FAR_FUTURE = 4102444800000; // año 2100

/** Modo de pruebas: el servidor avisó que todo es gratis, así que no se pide pase. */
export function isFreeAccess(): boolean {
  try {
    return localStorage.getItem(FREE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFreeAccess(on: boolean): void {
  try {
    if (on) localStorage.setItem(FREE_KEY, '1');
    else localStorage.removeItem(FREE_KEY);
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}

const keyFor = (siteId: string) => `${STORAGE_KEY_PREFIX}${siteId.toLowerCase()}`;

function clearPass(siteId: string): void {
  try {
    localStorage.removeItem(keyFor(siteId));
    if (siteId.toLowerCase() === 'mna') {
      localStorage.removeItem(MNA_TOUR_PASS_KEY);
      localStorage.removeItem(MNA_TOUR_EXPIRES_KEY);
    }
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}

/** Sitio ficticio del pase combinado: lo compra una vez y abre todos los sitios. */
export const COMBO_SITE = 'todos';

let freeSites = new Set<string>();

/** Sitios que no piden pase (columna `acceso` = gratis en la hoja CONTROL). La app los recibe en sites.json. */
export function setFreeSites(ids: string[]): void {
  freeSites = new Set(ids.map((id) => id.toLowerCase()));
}

export const isFreeSite = (siteId: string): boolean => freeSites.has(siteId.toLowerCase());

/** El pase guardado con esa clave, si sigue vigente (si venció, se borra). */
function readStored(siteId: string): SiteLicense | null {
  const raw = localStorage.getItem(keyFor(siteId));
  if (!raw) return null;
  const license: SiteLicense = JSON.parse(raw);
  if (license.expires_at && license.expires_at > Date.now()) return license;
  clearPass(siteId); // venció
  return null;
}

/** Pases guardados que no son del propio sitio pero lo abren (un pase combinado). El primero vigente. */
function readCovering(siteId: string): SiteLicense | null {
  const wanted = siteId.toLowerCase();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith(STORAGE_KEY_PREFIX)) continue;
    const id = key.slice(STORAGE_KEY_PREFIX.length);
    if (id === wanted) continue;
    let license: SiteLicense | null = null;
    try {
      license = readStored(id);
    } catch {
      continue;
    }
    if (license && (id === COMBO_SITE || license.covers?.includes(COMBO_SITE) || license.covers?.includes(wanted))) return license;
  }
  return null;
}

/** El pase guardado en este dispositivo para ese sitio (el suyo o un pase combinado que lo incluya), si sigue vigente. */
export function getSiteLicense(siteId: string): SiteLicense | null {
  if (isFreeAccess() || isFreeSite(siteId)) return { site_id: siteId.toLowerCase(), expires_at: FAR_FUTURE, device_id: getOrCreateDeviceId(), token: FREE_TOKEN };
  try {
    const own = readStored(siteId);
    if (own) return own;
    const combo = readCovering(siteId);
    if (combo) return combo;

    // Pases guardados por versiones anteriores de la app (solo MNA, sin clave)
    if (siteId.toLowerCase() === 'mna') {
      const isActive = localStorage.getItem(MNA_TOUR_PASS_KEY);
      const expiresAt = parseInt(localStorage.getItem(MNA_TOUR_EXPIRES_KEY) || '0', 10);
      if (isActive === 'true' && expiresAt > Date.now()) {
        return { site_id: 'mna', expires_at: expiresAt, device_id: getOrCreateDeviceId() };
      }
      if (isActive || expiresAt) clearPass(siteId);
    }
    return null;
  } catch {
    return null;
  }
}

export function hasActivePass(siteId: string): boolean {
  const license = getSiteLicense(siteId);
  return !!license && license.expires_at > Date.now();
}

export interface PassGrant {
  /** Clave firmada por el servidor de pagos (da acceso a los audios de pago). */
  token?: string;
  /** Sitios que abre el pase (un pase combinado abre varios). */
  covers?: string[];
  /** Vencimiento en milisegundos; si falta se cuentan PASS_HOURS desde ahora. */
  expiresAt?: number;
  /** Código corto para activar el pase en un segundo dispositivo. */
  code?: string;
}

/** Guarda un pase en este dispositivo. Sin `grant` es un pase de prueba (modo demo / pruebas). */
export function activatePass(siteId: string, hours = PASS_HOURS, grant: PassGrant = {}): SiteLicense {
  const expiresAt = grant.expiresAt ?? Date.now() + hours * 60 * 60 * 1000;
  const license: SiteLicense = {
    site_id: siteId.toLowerCase(),
    expires_at: expiresAt,
    device_id: getOrCreateDeviceId(),
    ...(grant.token ? { token: grant.token } : {}),
    ...(grant.code ? { code: grant.code } : {}),
    ...(grant.covers?.length ? { covers: grant.covers } : {}),
  };
  try {
    localStorage.setItem(keyFor(siteId), JSON.stringify(license));
    if (siteId.toLowerCase() === 'mna') {
      localStorage.setItem(MNA_TOUR_PASS_KEY, 'true');
      localStorage.setItem(MNA_TOUR_EXPIRES_KEY, String(expiresAt));
    }
  } catch (err) {
    console.warn('Unable to persist pass in localStorage', err);
  }
  return license;
}

export function revokePass(siteId: string): void {
  setFreeAccess(false); // si el servidor ya no regala el acceso, se vuelve a pedir pase
  // Si el sitio no tiene pase propio, la clave que el servidor rechazó es la de un pase combinado
  try {
    if (localStorage.getItem(keyFor(siteId)) === null) {
      const combinado = readCovering(siteId);
      if (combinado) {
        clearPass(combinado.site_id);
        return;
      }
    }
  } catch {
    /* sin almacenamiento */
  }
  clearPass(siteId);
}

/** Tiempo que le queda al pase, como "3h 20m" o "12m". Vacío si ya venció. (Sin palabras: sirve en cualquier idioma.) */
export function formatRemainingHours(expiresAt: number): string {
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return '';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours >= 1 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
}

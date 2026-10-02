import { SiteLicense } from '../types';
import { PASS_HOURS } from '../config/pass';

const STORAGE_KEY_PREFIX = 'audioguias_pass_';
const DEVICE_ID_KEY = 'audioguias_device_id';
export const MNA_TOUR_PASS_KEY = 'mna_tour_pass_active';
export const MNA_TOUR_EXPIRES_KEY = 'mna_tour_pass_expires';

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

/** El pase guardado en este dispositivo para ese sitio, si sigue vigente. */
export function getSiteLicense(siteId: string): SiteLicense | null {
  try {
    const raw = localStorage.getItem(keyFor(siteId));
    if (raw) {
      const license: SiteLicense = JSON.parse(raw);
      if (license.expires_at && license.expires_at > Date.now()) return license;
      clearPass(siteId); // venció
      return null;
    }

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

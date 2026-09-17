import { SiteLicense } from '../types';

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

export function getSiteLicense(siteId: string): SiteLicense | null {
  try {
    // Check mna_tour_pass_active first if it's MNA
    if (siteId.toLowerCase() === 'mna') {
      const isActive = localStorage.getItem(MNA_TOUR_PASS_KEY);
      const rawExp = localStorage.getItem(MNA_TOUR_EXPIRES_KEY);
      const expiresAt = rawExp ? parseInt(rawExp, 10) : 0;
      if (isActive === 'true' && expiresAt > Date.now()) {
        return {
          site_id: 'mna',
          expires_at: expiresAt,
          device_id: getOrCreateDeviceId(),
        };
      }
    }

    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${siteId.toLowerCase()}`);
    if (!raw) return null;
    const license: SiteLicense = JSON.parse(raw);
    if (license.expires_at && license.expires_at > Date.now()) {
      return license;
    }
    // Expired
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${siteId.toLowerCase()}`);
    if (siteId.toLowerCase() === 'mna') {
      localStorage.removeItem(MNA_TOUR_PASS_KEY);
      localStorage.removeItem(MNA_TOUR_EXPIRES_KEY);
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

export function activatePass(siteId: string, hours = 72): SiteLicense {
  const deviceId = getOrCreateDeviceId();
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  const license: SiteLicense = {
    site_id: siteId.toLowerCase(),
    expires_at: expiresAt,
    device_id: deviceId,
  };
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${siteId.toLowerCase()}`, JSON.stringify(license));
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
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${siteId.toLowerCase()}`);
    if (siteId.toLowerCase() === 'mna') {
      localStorage.removeItem(MNA_TOUR_PASS_KEY);
      localStorage.removeItem(MNA_TOUR_EXPIRES_KEY);
    }
  } catch (err) {
    console.warn('Unable to remove pass from localStorage', err);
  }
}

export function formatRemainingHours(expiresAt: number): string {
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'Expirado';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 1) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m restantes`;
}

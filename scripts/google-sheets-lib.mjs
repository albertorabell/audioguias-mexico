// Lectura PRIVADA de Google Sheets con una cuenta de servicio (el "robot").
// No usa paquetes: firma el pase (JWT) con el módulo crypto de Node y llama a la API de Google.
// La clave viene de la variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON (secreto de GitHub). Nunca se escribe en archivos.
import crypto from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

let tokenCache = null;

export function hayClave() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

async function pedirToken(scope) {
  if (tokenCache && tokenCache.scope === scope && tokenCache.exp > Date.now() + 60000) return tokenCache.token;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Falta el secreto GOOGLE_SERVICE_ACCOUNT_JSON (GitHub > Settings > Secrets and variables > Actions).');
  let key;
  try { key = JSON.parse(raw); } catch { throw new Error('El secreto GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido (¿se pegó completo?).'); }
  if (!key.client_email || !key.private_key) throw new Error('El secreto GOOGLE_SERVICE_ACCOUNT_JSON no trae client_email o private_key.');
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ iss: key.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const firma = crypto.createSign('RSA-SHA256').update(`${head}.${body}`).sign(key.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${body}.${b64url(firma)}` }),
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`Google no dio el pase (HTTP ${res.status}): ${json.error_description || json.error || 'sin detalle'}`);
  tokenCache = { scope, token: json.access_token, exp: Date.now() + (json.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

async function api(url, scope) {
  let ultimo;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const token = await pedirToken(scope);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60000) });
      if (res.ok) return await res.json();
      const txt = await res.text();
      const err = new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
      if (res.status < 500 && res.status !== 429) throw Object.assign(err, { fatal: true });
      ultimo = err;
    } catch (e) {
      if (e.fatal) throw e;
      ultimo = e;
    }
    if (intento < 3) await new Promise((r) => setTimeout(r, 2000 * intento));
  }
  throw ultimo;
}

/** Lee una pestaña completa. Devuelve filas (arreglo de arreglos de texto), igual que parseCsv. */
export async function leerPestana(spreadsheetId, pestana) {
  const rango = encodeURIComponent(`'${pestana.replace(/'/g, "''")}'`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rango}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const json = await api(url, 'https://www.googleapis.com/auth/spreadsheets.readonly');
  const filas = json.values || [];
  const ancho = filas.reduce((m, f) => Math.max(m, f.length), 0);
  return filas.map((f) => Array.from({ length: ancho }, (_, i) => String(f[i] ?? '')));
}

async function apiEscribir(url, metodo, cuerpo) {
  let ultimo;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const token = await pedirToken('https://www.googleapis.com/auth/spreadsheets');
      const res = await fetch(url, { method: metodo, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(120000) });
      if (res.ok) return await res.json();
      const txt = await res.text();
      ultimo = new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
      if (res.status < 500 && res.status !== 429) throw Object.assign(ultimo, { fatal: true });
    } catch (e) {
      if (e.fatal) throw e;
      ultimo = e;
    }
    if (intento < 3) await new Promise((r) => setTimeout(r, 3000 * intento));
  }
  throw ultimo;
}

/** Borra una pestaña y la vuelve a llenar con `filas` (texto tal cual, sin interpretar fórmulas). La hoja debe tener filas de sobra. */
export async function reemplazarPestana(spreadsheetId, pestana, filas, tamanoLote = 1500) {
  const q = encodeURIComponent(`'${pestana.replace(/'/g, "''")}'`);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values`;
  await apiEscribir(`${base}/${q}:clear`, 'POST', {});
  for (let i = 0; i < filas.length; i += tamanoLote) {
    const lote = filas.slice(i, i + tamanoLote);
    const rango = encodeURIComponent(`'${pestana.replace(/'/g, "''")}'!A${i + 1}`);
    await apiEscribir(`${base}/${rango}?valueInputOption=RAW`, 'PUT', { majorDimension: 'ROWS', values: lote });
  }
}

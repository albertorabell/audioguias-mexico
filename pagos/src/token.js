// Claves de acceso firmadas (HMAC-SHA256). Solo el servidor conoce TOKEN_SECRET, así que nadie puede fabricar una.
const enc = new TextEncoder();

const toB64u = (bytes) => {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64u = (str) => {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const hmacKey = (secret, usages) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);

/** payload: { site, dev, exp (ms), sid } → "cuerpo.firma" */
export async function signToken(payload, secret) {
  const body = toB64u(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, ['sign']), enc.encode(body));
  return `${body}.${toB64u(sig)}`;
}

/** Devuelve el contenido si la firma es válida y no ha vencido; si no, null. */
export async function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret, ['verify']), fromB64u(parts[1]), enc.encode(parts[0]));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64u(parts[0])));
    if (!payload || typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

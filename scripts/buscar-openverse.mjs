// Busca fotos candidatas en Openverse (Flickr y otros con licencia comercial) y arma hojas de contacto.
// Solo CC0, dominio público, CC BY y CC BY-SA. Excluye lo que viene de Wikimedia (eso ya lo cubre buscar-fotos.mjs).
// Uso: node scripts/buscar-openverse.mjs --consultas scripts/fotos/consultas-openverse-faltantes.json --salida candidatas
// Consultas: { "piece_id": ["texto de búsqueda", ...] }
import fs from 'node:fs';
import path from 'node:path';

const UA = 'AudioguiasMexico/1.0 (https://github.com/albertorabell/audioguias-mexico)';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(url) {
  let ultimo;
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) { ultimo = e; await pausa(2500 * i); }
  }
  throw ultimo;
}
const PERMITIDAS = new Set(['cc0', 'pdm', 'by', 'by-sa']);

async function buscar(texto) {
  const u = `https://api.openverse.org/v1/images/?${new URLSearchParams({ q: texto, license_type: 'commercial', page_size: '20', mature: 'false' })}`;
  const r = await pedir(u);
  if (!r.ok) { console.log(`::warning::Openverse HTTP ${r.status} para "${texto}"`); return []; }
  const j = await r.json();
  const salida = [];
  for (const x of j.results || []) {
    const l = String(x.license || '').toLowerCase();
    if (!PERMITIDAS.has(l)) continue;
    if (/wikimedia|wikipedia/i.test(`${x.source || ''} ${x.provider || ''}`)) continue;
    if ((x.width || 0) < 1000) continue;
    const lic = l === 'cc0' ? 'CC0 1.0' : l === 'pdm' ? 'Public domain' : `CC ${l.toUpperCase()} ${x.license_version || ''}`.trim();
    salida.push({
      titulo: `File:${x.title || x.id}`, pagina: x.foreign_landing_url || x.url, miniatura: x.thumbnail || x.url,
      ancho: x.width, alto: x.height, mime: 'image/jpeg', licencia: lic, autor: x.creator || '',
      fuente: x.source || x.provider || '', original: x.url, consulta: texto,
    });
  }
  return salida;
}

async function main() {
  const args = process.argv.slice(2);
  const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const consultas = JSON.parse(fs.readFileSync(val('--consultas'), 'utf8'));
  const salida = path.resolve(val('--salida', 'candidatas'));
  const sharp = (await import('sharp')).default;
  fs.mkdirSync(salida, { recursive: true });
  const manifiesto = {};
  for (const [id, qs] of Object.entries(consultas)) {
    try {
      const lista = [];
      const vistas = new Set();
      for (const q of qs) {
        for (const x of await buscar(q)) if (!vistas.has(x.pagina)) { vistas.add(x.pagina); lista.push(x); }
        await pausa(700);
      }
      manifiesto[id] = lista;
      console.log(`${id}: ${lista.length} candidatas`);
      if (!lista.length) continue;
      const celdas = [];
      for (let n = 0; n < lista.length; n++) {
        try {
          const r = await pedir(lista[n].miniatura);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const buf = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize(480, 360, { fit: 'cover' }).jpeg({ quality: 78 }).toBuffer();
          const rotulo = Buffer.from(`<svg width="480" height="360"><rect x="0" y="0" width="44" height="36" fill="#000a"/><text x="8" y="27" font-size="26" fill="#fff" font-family="sans-serif">${n + 1}</text></svg>`);
          celdas.push(await sharp(buf).composite([{ input: rotulo }]).jpeg({ quality: 78 }).toBuffer());
        } catch { celdas.push(await sharp({ create: { width: 480, height: 360, channels: 3, background: '#555' } }).jpeg().toBuffer()); }
        await pausa(250);
      }
      const cols = 3, filas = Math.ceil(celdas.length / cols);
      await sharp({ create: { width: cols * 480, height: filas * 360, channels: 3, background: '#222' } })
        .composite(celdas.map((input, k) => ({ input, left: (k % cols) * 480, top: Math.floor(k / cols) * 360 })))
        .jpeg({ quality: 80 }).toFile(path.join(salida, `${id}.jpg`));
    } catch (e) { console.log(`::warning::${id}: error ${e.message}`); }
  }
  fs.writeFileSync(path.join(salida, 'manifiesto.json'), JSON.stringify(manifiesto, null, 1));
  console.log(`::notice::Candidatas de Openverse listas para ${Object.keys(manifiesto).length} paradas.`);
}
main().catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });

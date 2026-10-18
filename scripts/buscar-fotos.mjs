// Busca fotos candidatas en Wikimedia Commons para las paradas de un sitio y arma hojas de contacto para elegir.
// Solo deja pasar licencias abiertas (dominio público, CC0, CC BY, CC BY-SA). No escribe nada en el proyecto:
// deja los resultados en una carpeta (por defecto ./candidatas) con un manifiesto y una hoja de contacto por parada.
// Uso: node scripts/buscar-fotos.mjs --consultas scripts/fotos/consultas-centro-historico.json [--salida candidatas] [--max 6]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { licenciaPermitida } from './descargar-fotos.mjs';

const UA = 'AudioguiasMexico/1.0 (https://github.com/albertorabell/audioguias-mexico; albertorabell@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';
const limpio = (x) => String(x?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url) {
  let ultimo;
  for (let i = 1; i <= 5; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) { ultimo = e; await pausa(2000 * i); }
  }
  throw ultimo;
}
const api = async (params) => (await pedir(`${API}?${new URLSearchParams({ format: 'json', ...params })}`)).json();

async function buscarTitulos(consulta) {
  const j = await api({ action: 'query', list: 'search', srsearch: consulta, srnamespace: '6', srlimit: '30' });
  return (j?.query?.search || []).map((x) => x.title);
}

async function infos(titulos) {
  const salida = [];
  for (let i = 0; i < titulos.length; i += 40) {
    const j = await api({
      action: 'query', titles: titulos.slice(i, i + 40).join('|'), prop: 'imageinfo', redirects: '1',
      iiprop: 'url|size|mime|extmetadata', iiurlwidth: '800',
    });
    for (const p of Object.values(j?.query?.pages || {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      salida.push({
        titulo: p.title, pagina: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_')).replace(/%3A/g, ':').replace(/%2F/g, '/')}`,
        miniatura: ii.thumburl || ii.url, ancho: ii.width, alto: ii.height, mime: ii.mime,
        licencia: limpio(m.LicenseShortName), autor: limpio(m.Artist), fecha: limpio(m.DateTimeOriginal),
        descripcion: limpio(m.ImageDescription).slice(0, 300), categorias: limpio(m.Categories).slice(0, 300),
      });
    }
    await pausa(300);
  }
  return salida;
}

function buenas(lista, max) {
  return lista
    .filter((x) => /^image\/(jpeg|png)/.test(x.mime) && licenciaPermitida(x.licencia) && x.ancho >= 1200)
    .filter((x) => !/(logo|map|mapa|plano|escudo|coat|flag|bandera_de|diagram|sello|stamp|poster|cartel)/i.test(x.titulo))
    .sort((a, b) => b.ancho * b.alto - a.ancho * a.alto)
    .slice(0, max);
}

async function main() {
  const args = process.argv.slice(2);
  const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const consultas = JSON.parse(fs.readFileSync(val('--consultas'), 'utf8'));
  const salida = path.resolve(val('--salida', 'candidatas'));
  const max = Number(val('--max', '6'));
  const sharp = (await import('sharp')).default;
  fs.mkdirSync(salida, { recursive: true });
  const manifiesto = {};
  for (const [id, qs] of Object.entries(consultas)) {
    try {
      const vistos = new Set();
      let titulos = [];
      for (const q of qs) for (const t of await buscarTitulos(q)) if (!vistos.has(t)) { vistos.add(t); titulos.push(t); }
      const lista = buenas(await infos(titulos), max);
      manifiesto[id] = lista;
      if (!lista.length) { console.log(`::warning::${id}: sin candidatas con licencia abierta y 1200 px o más (${titulos.length} resultados)`); continue; }
      console.log(`${id}: ${titulos.length} resultados, ${lista.length} sirven`);
      const celdas = [];
      for (let n = 0; n < lista.length; n++) {
        const r = await pedir(lista[n].miniatura);
        if (!r.ok) continue;
        const buf = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize(480, 360, { fit: 'cover' }).jpeg({ quality: 78 }).toBuffer();
        const rotulo = Buffer.from(`<svg width="480" height="360"><rect x="0" y="0" width="44" height="36" fill="#000a"/><text x="8" y="27" font-size="26" fill="#fff" font-family="sans-serif">${n + 1}</text></svg>`);
        celdas.push(await sharp(buf).composite([{ input: rotulo }]).jpeg({ quality: 78 }).toBuffer());
        await pausa(250);
      }
      const cols = 3, filas = Math.ceil(celdas.length / cols);
      await sharp({ create: { width: cols * 480, height: filas * 360, channels: 3, background: '#222' } })
        .composite(celdas.map((input, k) => ({ input, left: (k % cols) * 480, top: Math.floor(k / cols) * 360 })))
        .jpeg({ quality: 80 }).toFile(path.join(salida, `${id}.jpg`));
      console.log(`${id}: ${lista.length} candidatas`);
    } catch (e) { console.log(`::warning::${id}: error ${e.message}`); }
  }
  fs.writeFileSync(path.join(salida, 'manifiesto.json'), JSON.stringify(manifiesto, null, 1));
  console.log(`::notice::Candidatas listas para ${Object.keys(manifiesto).length} paradas.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
}

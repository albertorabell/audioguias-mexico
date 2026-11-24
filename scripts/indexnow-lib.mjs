// IndexNow: avisa a Bing (y a los buscadores que lo usan) de las páginas nuevas o cambiadas, para que no tengan que esperar a rastrear.
// Sin <lastmod> en el sitemap no sabemos qué cambió, así que se compara el HTML de cada página con el de la publicación anterior.
import crypto from 'node:crypto';

export const HOST = 'xolotli.com';
export const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** URLs de un sitemap.xml (solo <loc> de <url>, sin las versiones alternativas de xhtml:link). */
export function urlsDelSitemap(xml) {
  return [...String(xml).matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/** «https://xolotli.com/en/guides/x/» → «en/guides/x/index.html»; la portada → «index.html». */
export function archivoDeUrl(url) {
  const ruta = new URL(url).pathname.replace(/^\/+/, '');
  if (ruta === '' || ruta.endsWith('/')) return `${ruta}index.html`;
  return ruta;
}

export const huella = (texto) => crypto.createHash('sha256').update(texto).digest('hex').slice(0, 16);

/** URLs cuya huella no existía o cambió respecto a la anterior. */
export function cambiadas(nuevas, anteriores = {}) {
  return Object.keys(nuevas).filter((u) => anteriores[u] !== nuevas[u]);
}

/** Cuerpos para POST (máx. `tam` URLs por envío; el límite del protocolo es 10 000). */
export function lotes(urls, { key, tam = 1000 } = {}) {
  const salida = [];
  for (let i = 0; i < urls.length; i += tam) {
    salida.push({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls.slice(i, i + tam) });
  }
  return salida;
}

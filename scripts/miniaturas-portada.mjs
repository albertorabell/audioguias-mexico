// Miniaturas de 480 px de las fotos de portada (las tarjetas del inicio), para que la portada no baje fotos de 200 KB o más.
// Corre en el build, después de sync-data: lee public/data/sites.json y escribe public/images/pieces/thumbs/<archivo>.webp
// La app pide primero la miniatura y, si no existe, usa la foto completa (PieceImage con `thumb`).
import fs from 'node:fs';
import path from 'node:path';

export const ANCHO = 480;

/** Nombre del archivo de portada de un sitio, igual que lo calcula la app: cover_image o <cover_piece_id>.webp */
export function portadaDe(sitio) {
  if (sitio.status === 'coming_soon') return '';
  const f = String(sitio.cover_image || (sitio.cover_piece_id ? `${sitio.cover_piece_id}.webp` : '')).trim();
  return /^[\w.-]+\.(webp|png|jpe?g)$/i.test(f) ? f : '';
}

export async function hacerMiniaturas({ raiz = '.', sharp } = {}) {
  const sitiosPath = path.join(raiz, 'public/data/sites.json');
  if (!fs.existsSync(sitiosPath)) return { hechas: 0, faltan: [] };
  const sitios = JSON.parse(fs.readFileSync(sitiosPath, 'utf-8'));
  const dirFotos = path.join(raiz, 'public/images/pieces');
  const dirMini = path.join(dirFotos, 'thumbs');
  fs.mkdirSync(dirMini, { recursive: true });
  let hechas = 0;
  const faltan = [];
  for (const sitio of sitios) {
    const f = portadaDe(sitio);
    if (!f) continue;
    const origen = path.join(dirFotos, f);
    if (!fs.existsSync(origen)) {
      faltan.push(f);
      continue;
    }
    const destino = path.join(dirMini, f.replace(/\.[^.]+$/, '.webp'));
    if (fs.existsSync(destino) && fs.statSync(destino).mtimeMs >= fs.statSync(origen).mtimeMs) continue;
    await sharp(origen).resize({ width: ANCHO, withoutEnlargement: true }).webp({ quality: 78 }).toFile(destino);
    hechas++;
  }
  return { hechas, faltan };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const { default: sharp } = await import('sharp');
    const { hechas, faltan } = await hacerMiniaturas({ sharp });
    console.log(`Miniaturas de portada: ${hechas} nuevas${faltan.length ? `; sin foto de portada: ${faltan.join(', ')}` : ''}`);
  } catch (e) {
    // Sin miniaturas la app sigue funcionando (usa la foto completa): no se rompe el despliegue por esto
    console.warn(`Miniaturas de portada: se omiten (${e.message})`);
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { hacerMiniaturas, portadaDe, ANCHO } from '../miniaturas-portada.mjs';

test('portadaDe: archivo de portada como lo calcula la app', () => {
  assert.equal(portadaDe({ id: 'MNA', cover_piece_id: 'mna_s06_piedra_sol' }), 'mna_s06_piedra_sol.webp');
  assert.equal(portadaDe({ id: 'T', cover_image: 'teo_11.webp', cover_piece_id: 'x' }), 'teo_11.webp');
  assert.equal(portadaDe({ id: 'X', status: 'coming_soon', cover_image: 'a.webp' }), '');
  assert.equal(portadaDe({ id: 'X', cover_image: '../../etc/passwd' }), '');
  assert.equal(portadaDe({ id: 'X' }), '');
});

test('hacerMiniaturas: crea la de 480 px, no repite y avisa de las faltantes', async () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-'));
  fs.mkdirSync(path.join(raiz, 'public/data'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'public/images/pieces'), { recursive: true });
  await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#a33' } }).webp().toFile(path.join(raiz, 'public/images/pieces/foto_a.webp'));
  fs.writeFileSync(path.join(raiz, 'public/data/sites.json'), JSON.stringify([{ id: 'A', cover_image: 'foto_a.webp' }, { id: 'B', cover_image: 'no_existe.webp' }]));
  const r1 = await hacerMiniaturas({ raiz, sharp });
  assert.equal(r1.hechas, 1);
  assert.deepEqual(r1.faltan, ['no_existe.webp']);
  const meta = await sharp(path.join(raiz, 'public/images/pieces/thumbs/foto_a.webp')).metadata();
  assert.equal(meta.width, ANCHO);
  assert.equal((await hacerMiniaturas({ raiz, sharp })).hechas, 0);
});

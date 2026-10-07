// Pruebas de las muestras de voz. Se corren con:  node --test scripts/tests/muestras-voz.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, pickVoices, main, defaultVariants } from '../muestras-voz.mjs';

const pieces = [{ piece_id: 'p1', guion_corto: 'Hola mundo. Esta es una pieza de prueba para las voces.', guion_largo: 'Largo.' }];

function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'voz-test-'));
  fs.mkdirSync(path.join(dir, 'public/data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'public/data/pieces.json'), JSON.stringify(pieces));
  return dir;
}
const quiet = { log: () => {}, warn: () => {} };
const ENV = { AZURE_SPEECH_KEY: 'k', AZURE_SPEECH_REGION: 'eastus' };

const VOICES = [
  { ShortName: 'es-MX-A-Neural', Gender: 'Female', Locale: 'es-MX', Status: 'GA' },
  { ShortName: 'es-MX-B-Neural', Gender: 'Female', Locale: 'es-MX', Status: 'GA' },
  { ShortName: 'es-MX-C-Neural', Gender: 'Male', Locale: 'es-MX', Status: 'GA' },
  { ShortName: 'es-MX-D-Neural', Gender: 'Male', Locale: 'es-MX', Status: 'Preview' },
  { ShortName: 'es-ES-E-Neural', Gender: 'Male', Locale: 'es-ES', Status: 'GA' },
  { ShortName: 'es-MX-F-DragonHD', Gender: 'Male', Locale: 'es-MX', Status: 'GA' },
];

test('parseArgs valida opciones', () => {
  assert.equal(parseArgs([]).lang, 'es');
  assert.throws(() => parseArgs(['--lang', 'xx']));
  assert.throws(() => parseArgs(['--max-voces', '99']));
  assert.throws(() => parseArgs(['--cosa']));
});

test('pickVoices filtra por idioma y estado, y alterna mujer/hombre', () => {
  const v = pickVoices(VOICES, 'es-MX', 6).map((x) => x.ShortName);
  assert.deepEqual(v, ['es-MX-A-Neural', 'es-MX-C-Neural', 'es-MX-B-Neural']);
  assert.equal(pickVoices(VOICES, 'es-MX', 2).length, 2);
});

test('sin --generar solo muestra el plan y no llama a la red', async () => {
  const dir = tmpProject();
  let calls = 0;
  const code = await main(['--pieza', 'p1'], { root: dir, env: {}, fetchImpl: async () => { calls++; }, ...quiet });
  assert.equal(code, 0);
  assert.equal(calls, 0);
  assert.equal(fs.existsSync(path.join(dir, 'muestras-voz')), false);
});

test('genera MP3 e índice con voces de la lista de Azure', async () => {
  const dir = tmpProject();
  const urls = [];
  const fetchImpl = async (url, opts) => {
    urls.push(url);
    if (url.endsWith('/voices/list')) return { ok: true, json: async () => VOICES };
    assert.match(opts.body, /<voice name="es-MX-[AC]-Neural">/);
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  };
  const code = await main(['--pieza', 'p1', '--max-voces', '2', '--generar'], { root: dir, env: ENV, fetchImpl, ...quiet });
  assert.equal(code, 0);
  const out = path.join(dir, 'muestras-voz/es');
  assert.deepEqual(fs.readdirSync(out).sort(), ['es-MX-A-Neural.mp3', 'es-MX-C-Neural.mp3', 'indice.md']);
  assert.match(fs.readFileSync(path.join(out, 'indice.md'), 'utf-8'), /es-MX-A-Neural/);
});

test('una voz inválida falla pero las demás siguen', async () => {
  const dir = tmpProject();
  const fetchImpl = async (url, opts) => {
    if (opts.body.includes('mala')) return { ok: false, status: 400, text: async () => 'voz no existe' };
    return { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer };
  };
  const code = await main(['--pieza', 'p1', '--voces', 'mala,buena', '--generar'], { root: dir, env: ENV, fetchImpl, ...quiet });
  assert.equal(code, 0);
  const idx = fs.readFileSync(path.join(dir, 'muestras-voz/es/indice.md'), 'utf-8');
  assert.match(idx, /buena\.mp3/);
  assert.match(idx, /No se pudieron generar[\s\S]*mala/);
});

test('un 401 detiene todo', async () => {
  const dir = tmpProject();
  let calls = 0;
  const fetchImpl = async () => { calls++; return { ok: false, status: 401, text: async () => 'no' }; };
  const code = await main(['--pieza', 'p1', '--voces', 'a,b,c', '--generar'], { root: dir, env: ENV, fetchImpl, ...quiet });
  assert.equal(code, 1);
  assert.equal(calls, 1);
});

test('faltan claves de Azure: error claro', async () => {
  const dir = tmpProject();
  await assert.rejects(() => main(['--pieza', 'p1', '--generar'], { root: dir, env: {}, fetchImpl: async () => {}, ...quiet }), /Faltan las claves/);
});

test('proveedor prueba escribe MP3 en silencio sin red', async () => {
  const dir = tmpProject();
  const code = await main(['--pieza', 'p1', '--proveedor', 'prueba', '--generar'], { root: dir, env: {}, fetchImpl: async () => { throw new Error('red'); }, ...quiet });
  assert.equal(code, 0);
  assert.ok(fs.statSync(path.join(dir, 'muestras-voz/es/prueba-A.mp3')).size > 0);
});

test('idioma sin traducción da error claro', async () => {
  const dir = tmpProject();
  await assert.rejects(() => main(['--pieza', 'p1', '--lang', 'en'], { root: dir, env: {}, ...quiet }), /Falta traducirla/);
});

test('--pronunciar genera una muestra sin cambio y una por variante, con el elemento SSML correcto', async () => {
  const dir = tmpProject();
  const bodies = [];
  const fetchImpl = async (url, opts) => {
    bodies.push(opts.body);
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2]).buffer };
  };
  const code = await main(['--pronunciar', 'mexicas', '--variantes', 'alias:meshicas,ipa:meˈʃikas', '--voces', 'es-MX-A-Neural', '--generar'], { root: dir, env: ENV, fetchImpl, ...quiet });
  assert.equal(code, 0);
  const out = path.join(dir, 'muestras-voz/es');
  const names = fs.readdirSync(out).sort();
  assert.equal(names.length, 4); // 3 variantes + índice
  assert.ok(names.includes('es-MX-A-Neural__0_sin_cambio.mp3'));
  assert.ok(names.includes('es-MX-A-Neural__1_alias_meshicas.mp3'));
  assert.ok(names.some((n) => n.startsWith('es-MX-A-Neural__2_ipa_')));
  assert.ok(!bodies[0].includes('<sub') && !bodies[0].includes('<phoneme'));
  assert.ok(bodies[1].includes('<sub alias="meshicas">mexicas</sub>'));
  assert.ok(bodies[2].includes('<phoneme alphabet="ipa" ph="meˈʃikas">mexicas</phoneme>'));
  assert.match(fs.readFileSync(path.join(out, 'indice.md'), 'utf-8'), /alias:meshicas/);
});

test('--pronunciar exige variantes válidas', () => {
  assert.throws(() => parseArgs(['--pronunciar', 'casa']), /--variantes/);
  assert.throws(() => parseArgs(['--pronunciar', 'x', '--variantes', 'foo:bar']), /Variante no válida/);
  assert.throws(() => parseArgs(['--pronunciar', 'x', '--variantes', 'alias:']), /Variante no válida/);
});

test('las muestras normales usan la lista de pronunciaciones del proyecto', async () => {
  const dir = tmpProject();
  fs.mkdirSync(path.join(dir, 'glosario'));
  fs.writeFileSync(path.join(dir, 'glosario/pronunciacion.csv'), 'idioma,palabra,tipo,valor,nota\nes,mundo,alias,mundoo,\n');
  const bodies = [];
  const fetchImpl = async (url, opts) => {
    bodies.push(opts.body);
    return { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer };
  };
  await main(['--pieza', 'p1', '--voces', 'es-MX-A-Neural', '--generar'], { root: dir, env: ENV, fetchImpl, ...quiet });
  assert.ok(bodies[0].includes('<sub alias="mundoo">mundo</sub>'), bodies[0]);
});

test('--pronunciar sin variantes inventa tres para palabras con x', () => {
  assert.deepEqual(defaultVariants('Mexicas'), [
    { kind: 'alias', value: 'meshicas' },
    { kind: 'alias', value: 'mesicas' },
    { kind: 'ipa', value: 'meʃikas' },
  ]);
  assert.equal(defaultVariants('Xochipilli').at(-1).value, 'ʃotʃipiʝi');
  assert.equal(parseArgs(['--pronunciar', 'mexicas']).variantes.length, 3);
});

test('--pronunciar con variantes de voz y de idioma arma el SSML con la voz principal de cada muestra', async () => {
  const dir = tmpProject();
  const bodies = [];
  const fetchImpl = async (url, opts) => {
    bodies.push(opts.body);
    return { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer };
  };
  await main(['--pronunciar', 'mexicas', '--variantes', 'voz:en-US-AvaMultilingualNeural=meshicas,lang:en-US=meshicas', '--voces', 'es-MX-A-Neural', '--generar'], { root: dir, env: ENV, fetchImpl, ...quiet });
  assert.equal(bodies.length, 3);
  assert.ok(bodies[1].includes('</voice><voice name="en-US-AvaMultilingualNeural">meshicas</voice><voice name="es-MX-A-Neural">'));
  assert.equal((bodies[1].match(/<voice /g) || []).length, (bodies[1].match(/<\/voice>/g) || []).length);
  assert.ok(bodies[2].includes('<lang xml:lang="en-US">meshicas</lang>'));
});

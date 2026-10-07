// Pruebas del traductor: protecciones de gasto, huellas, glosario, revisiones y unión con las piezas.
// Ejecutar con: node --test scripts/tests
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, parseArgs } from '../traducir.mjs';
import { applyStoredTranslations, buildSystemPrompt, fieldHash, glossaryFor, loadGlossary, sourceFields, validateTranslation, usdFromUsage } from '../traducir-lib.mjs';

const GLOSSARY = `categoria,tipo,espanol,ingles_propuesto,veces_en_los_textos,nota,frances_propuesto
Dioses,igual,Tláloc,Tláloc,23,,Tláloc
Sitios,igual,Tula,Tula,60,,Tula
Términos,igual,Homo,Homo,6,,Homo
Periodos,traducir,Posclásico Tardío,Late Postclassic,34,,Postclassique récent
Pueblos,aprobado,Wixárika / Huichol,Wixárika (Huichol),9,,Wixárika (Huichol)
Pueblos,traducir,Olmeca / Olmecas,Olmec,5,,Olmèque
Pueblos,igual,Mexica,Mexica,50,,Mexica
Sin decidir,revisar,Puréecherio,Purépecha Hall,3,,Salle Purépecha
Museo,traducir,Sala,Hall,190,,Salle
Sin francés,traducir,Dios Raro,Weird God,1,,
`;

const LONG_ES =
  'Al contemplar este colosal disco de basalto de veinticuatro toneladas, la mirada es absorbida por el centro de la creación. ' +
  'La piel se eriza ante el rostro de Tláloc, proyectado en el año 1521 con la lengua en forma de cuchillo.';
const LONG_EN =
  'As you gaze at this colossal basalt disk of twenty-four tons, your eyes are drawn to the center of creation. ' +
  'Goosebumps rise before the face of Tláloc, shown in the year 1521 with its tongue shaped like a knife.';

function makeRoot(nPieces = 12) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'traducir-test-'));
  fs.mkdirSync(path.join(root, 'public/data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'glosario'));
  fs.writeFileSync(path.join(root, 'glosario/glosario.csv'), GLOSSARY);
  const pieces = [];
  for (let i = 0; i < nPieces; i++) {
    pieces.push({
      piece_id: `p${String(i).padStart(2, '0')}`,
      room_id: 'sala-01',
      titulo: `Pieza ${i}`,
      frase_gancho: 'Un monolito sagrado labrado en piedra.',
      puente_narrativo: '',
      guion_corto: LONG_ES,
      guion_largo: LONG_ES + ' ' + LONG_ES,
      retos_observacion: ['Busca la lengua de pedernal', 'Cuenta las serpientes'],
      especificaciones: { Cultura: 'Mexica', Medidas: '3.58 m de diámetro' },
      faq_mito: { pregunta: 'Mito: Era un calendario.', respuesta: 'Realidad: Era una plataforma ceremonial.' },
    });
  }
  fs.writeFileSync(path.join(root, 'public/data/pieces.json'), JSON.stringify(pieces));
  fs.writeFileSync(
    path.join(root, 'public/data/rooms.json'),
    JSON.stringify([{ room_id: 'sala-01', nombre_oficial: 'Sala Mexica', frase_gancho: 'El corazón del imperio.', introduccion_narrativa: '' }])
  );
  return root;
}

const quiet = { log: () => {}, warn: () => {} };
const noNetwork = async () => { throw new Error('no debía llamar a la red'); };
const files = (root) => (fs.existsSync(path.join(root, 'traducciones/en')) ? fs.readdirSync(path.join(root, 'traducciones/en')).filter((f) => f.endsWith('.json') && !f.startsWith('_')) : []);

/** Respuesta de la API de mentiras: traduce lo que le pidan con textos "ingleses" válidos. */
function fakeApi(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    return handler(body, calls.length);
  };
  return { fetchImpl, calls };
}
const okReply = (usage = { input_tokens: 1000, output_tokens: 500 }) => (body) => {
  const user = body.messages[0].content;
  const src = JSON.parse(user.slice(user.indexOf('{'), user.lastIndexOf('}') + 1));
  const en = {};
  for (const [k, v] of Object.entries(src)) {
    if (k === 'titulo') en[k] = String(v).replace('Pieza', 'Piece');
    else if (k === 'frase_gancho') en[k] = 'A sacred monolith carved in stone.';
    else if (k === 'guion_corto') en[k] = LONG_EN;
    else if (k === 'guion_largo') en[k] = LONG_EN + ' ' + LONG_EN;
    else if (k === 'retos_observacion') en[k] = ['Find the flint tongue', 'Count the serpents'];
    else if (k === 'especificaciones') en[k] = { Culture: 'Mexica', Dimensions: '3.58 m in diameter' };
    else if (k === 'faq_mito') en[k] = { pregunta: 'Myth: It was a calendar.', respuesta: 'Reality: It was a ceremonial platform.' };
    else if (k === 'nombre_oficial') en[k] = 'Mexica Hall';
    else en[k] = 'The heart of the empire.';
  }
  return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(en) }], usage, stop_reason: 'end_turn' }), text: async () => '' };
};

test('sin --generar solo muestra el plan: no llama a la API ni guarda nada', async () => {
  const root = makeRoot();
  const lines = [];
  const code = await main([], { root, env: {}, fetchImpl: noNetwork, log: (l) => lines.push(l), warn: () => {} });
  assert.equal(code, 0);
  assert.equal(files(root).length, 0);
  assert.ok(lines.join('\n').includes('no se llamó a ninguna API'));
  assert.ok(lines.join('\n').includes('límite 5'));
});

test('las opciones inválidas se rechazan', () => {
  assert.throws(() => parseArgs(['--lang', 'de']), /Idioma no válido/);
  assert.throws(() => parseArgs(['--limite', '0']), /mayor que 0/);
  assert.throws(() => parseArgs(['--max-usd', '-1']), /mayor que 0/);
  assert.throws(() => parseArgs(['--proveedor', 'otro']), /claude o prueba/);
  assert.throws(() => parseArgs(['--rara']), /desconocida/);
});

test('--limite se respeta y la siguiente corrida sigue donde se quedó', async () => {
  const root = makeRoot(12);
  await main(['--proveedor', 'prueba', '--generar', '--limite', '3'], { root, env: {}, ...quiet });
  assert.equal(files(root).filter((f) => f.startsWith('pieza_')).length, 3);
  await main(['--proveedor', 'prueba', '--generar', '--limite', '3'], { root, env: {}, ...quiet });
  assert.equal(files(root).filter((f) => f.startsWith('pieza_')).length, 6);
  assert.ok(fs.existsSync(path.join(root, 'traducciones/en/_ultima_corrida.md')));
});

test('si el texto en español cambia, solo se vuelve a traducir ese campo', async () => {
  const root = makeRoot(2);
  await main(['--proveedor', 'prueba', '--generar', '--piezas', 'p00'], { root, env: {}, ...quiet });
  const file = path.join(root, 'traducciones/en/pieza_p00.json');
  const before = JSON.parse(fs.readFileSync(file, 'utf-8'));
  assert.equal(Object.keys(before.campos).length, 7); // puente_narrativo va vacío: no se traduce

  const pieces = JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'));
  pieces[0].frase_gancho = 'Otra frase distinta.';
  fs.writeFileSync(path.join(root, 'public/data/pieces.json'), JSON.stringify(pieces));

  const lines = [];
  await main(['--proveedor', 'prueba', '--generar', '--piezas', 'p00'], { root, env: {}, log: (l) => lines.push(l), warn: () => {} });
  const after = JSON.parse(fs.readFileSync(file, 'utf-8'));
  assert.equal(after.campos.frase_gancho.texto, '[EN] Otra frase distinta.');
  assert.deepEqual(after.campos.guion_corto, before.campos.guion_corto); // no se tocó
  assert.ok(lines.join('\n').includes('por traducir: 1'));
});

test('Claude: manda la clave, el modelo y el glosario, y guarda con huella', async () => {
  const root = makeRoot(1);
  const { fetchImpl, calls } = fakeApi(okReply());
  const code = await main(['--generar', '--piezas', 'p00', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'clave-falsa' }, fetchImpl, ...quiet });
  assert.equal(code, 0);
  assert.equal(calls.length, 1);
  const c = calls[0];
  assert.equal(c.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(c.init.headers['x-api-key'], 'clave-falsa');
  assert.equal(c.init.headers['anthropic-version'], '2023-06-01');
  assert.equal(c.body.model, 'claude-sonnet-5-5');
  assert.equal(c.body.system[0].cache_control.type, 'ephemeral');
  const user = c.body.messages[0].content;
  assert.ok(user.includes('Tláloc → KEEP'), 'el glosario debe incluir los nombres que aparecen en el texto');
  assert.ok(!user.includes('Wixárika'), 'y no los que no aparecen');
  assert.ok(!user.includes('Puréecherio'), 'las preguntas sin decidir no entran');
  const saved = JSON.parse(fs.readFileSync(path.join(root, 'traducciones/en/pieza_p00.json'), 'utf-8'));
  const piece = JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'))[0];
  assert.equal(saved.campos.guion_corto.hash, fieldHash(piece.guion_corto));
  assert.equal(saved.campos.guion_corto.texto, LONG_EN);
  assert.deepEqual(saved.campos.especificaciones.texto, { Culture: 'Mexica', Dimensions: '3.58 m in diameter' });
});

test('Claude: sin ANTHROPIC_API_KEY falla con un mensaje claro y sin llamar a la red', async () => {
  const root = makeRoot(1);
  await assert.rejects(() => main(['--generar'], { root, env: {}, fetchImpl: noNetwork, ...quiet }), /ANTHROPIC_API_KEY/);
});

test('el tope en dólares detiene la corrida antes de llamar a la API', async () => {
  const root = makeRoot(5);
  const { fetchImpl, calls } = fakeApi(okReply());
  const lines = [];
  await main(['--generar', '--max-usd', '0.0001'], { root, env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl, log: (l) => lines.push(l), warn: () => {} });
  assert.equal(calls.length, 0);
  assert.equal(files(root).length, 0);
  assert.ok(lines.join('\n').includes('Me detengo'));
});

test('el gasto real (según lo que informa la API) cuenta para el tope', async () => {
  const root = makeRoot(5);
  // cada llamada "cuesta" 3 dólares (1M tokens de salida a 10 = 10 USD → usamos 300k = 3 USD)
  const { fetchImpl, calls } = fakeApi(okReply({ input_tokens: 0, output_tokens: 300000 }));
  await main(['--generar', '--max-usd', '4', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'k', TRADUCIR_USD_SALIDA: '10' }, fetchImpl, ...quiet });
  // la 1.ª cuesta 3; antes de la 2.ª, 3 + estimado < 4 sigue cabiendo; la 2.ª sube a 6; la 3.ª ya no cabe
  assert.equal(calls.length, 2);
});

test('una traducción que no pasa las revisiones NO se guarda', async () => {
  const root = makeRoot(1);
  // devuelve el texto sin traducir (en español)
  const { fetchImpl } = fakeApi((body) => {
    const user = body.messages[0].content;
    const src = JSON.parse(user.slice(user.indexOf('{'), user.lastIndexOf('}') + 1));
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(src) }], usage: {}, stop_reason: 'end_turn' }), text: async () => '' };
  });
  const warns = [];
  const code = await main(['--generar', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl, log: () => {}, warn: (w) => warns.push(w) });
  assert.equal(code, 1);
  assert.equal(files(root).length, 0);
  assert.ok(warns.join('\n').includes('texto en español'));
});

test('un error de clave (401) detiene la corrida de inmediato', async () => {
  const root = makeRoot(5);
  const { fetchImpl, calls } = fakeApi(() => ({ ok: false, status: 401, text: async () => 'invalid x-api-key', json: async () => ({}) }));
  const code = await main(['--generar', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'mala' }, fetchImpl, ...quiet });
  assert.equal(calls.length, 1);
  assert.equal(code, 1);
});

test('un error temporal (529) se reintenta y luego funciona', async () => {
  const root = makeRoot(1);
  const ok = okReply();
  const { fetchImpl, calls } = fakeApi((body, n) => (n === 1 ? { ok: false, status: 529, text: async () => 'overloaded', json: async () => ({}) } : ok(body)));
  const code = await main(['--generar', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl, retryBaseMs: 1, ...quiet });
  assert.equal(code, 0);
  assert.equal(calls.length, 2);
  assert.equal(files(root).length, 1);
});

test('una respuesta cortada por límite de largo se descarta', async () => {
  const root = makeRoot(1);
  const { fetchImpl } = fakeApi(() => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"titulo":"Pie' }], usage: {}, stop_reason: 'max_tokens' }), text: async () => '' }));
  const code = await main(['--generar', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl, ...quiet });
  assert.equal(code, 1);
  assert.equal(files(root).length, 0);
});

test('revisiones: forma, idioma, números y glosario', () => {
  const glossary = loadGlossary(path.join(makeRoot(1), 'glosario/glosario.csv'));
  const src = { guion_corto: LONG_ES, retos_observacion: ['a b c', 'd e f'], faq_mito: { pregunta: 'Mito: x', respuesta: 'Realidad: y' }, especificaciones: { Cultura: 'Mexica' } };
  const entries = glossaryFor(glossary, [LONG_ES]);

  const good = { guion_corto: LONG_EN, retos_observacion: ['a', 'b'], faq_mito: { pregunta: 'Myth: x', respuesta: 'Reality: y' }, especificaciones: { Culture: 'Mexica' } };
  const r1 = validateTranslation(src, good, entries);
  assert.deepEqual(r1.errors, []);
  assert.deepEqual(r1.warnings, {});

  // lista con otro número de elementos, faq con llaves traducidas, campo de más
  const bad = { ...good, retos_observacion: ['a'], faq_mito: { question: 'x', answer: 'y' }, extra: 'z' };
  const r2 = validateTxt(src, bad, entries);
  assert.ok(r2.some((e) => e.includes('retos_observacion')));
  assert.ok(r2.some((e) => e.includes('faq_mito')));
  assert.ok(r2.some((e) => e.includes('campos de más')));

  // se perdió el nombre del glosario y un año
  const noNames = { ...good, guion_corto: LONG_EN.replace('Tláloc', 'the rain god').replace('1521', 'that year') };
  const r3 = validateTranslation(src, noNames, entries);
  assert.deepEqual(r3.errors, []);
  assert.ok(r3.warnings.guion_corto.some((w) => w.includes('Tláloc')));
  assert.ok(r3.warnings.guion_corto.some((w) => w.includes('1521')));

  // formato markdown
  assert.ok(validateTxt(src, { ...good, guion_corto: '**' + LONG_EN + '**' }, entries).some((e) => e.includes('markdown')));
});
const validateTxt = (src, out, entries) => validateTranslation(src, out, entries).errors;

test('glosario: igual / con aclaración / sin decidir, y solo palabras completas', () => {
  const g = loadGlossary(path.join(makeRoot(1), 'glosario/glosario.csv'));
  assert.equal(g.find((x) => x.es === 'Tláloc').keep, true);
  const w = g.find((x) => x.es.startsWith('Wixárika'));
  assert.equal(w.first, true);
  assert.deepEqual(w.alts, ['Wixárika', 'Huichol']);
  assert.equal(g.some((x) => x.es === 'Puréecherio'), false);
  assert.deepEqual(glossaryFor(g, ['Una pieza homogénea del Posclásico Tardío']).map((x) => x.es), ['Posclásico Tardío']);
  assert.deepEqual(glossaryFor(g, ['Los huichol bordan']).map((x) => x.es), ['Wixárika / Huichol']);
});

test('unir traducciones: solo si la huella coincide, y la hoja manda', () => {
  const root = makeRoot(1);
  const dir = path.join(root, 'traducciones/en');
  fs.mkdirSync(dir, { recursive: true });
  const piece = { piece_id: 'p00', titulo: 'Pieza 0', frase_gancho: 'Cambió después', guion_corto: 'Texto', guion_largo: 'Largo', titulo_en: 'Hoja manda' };
  fs.writeFileSync(
    path.join(dir, 'pieza_p00.json'),
    JSON.stringify({
      campos: {
        titulo: { hash: fieldHash('Pieza 0'), texto: 'Piece 0' },
        frase_gancho: { hash: fieldHash('Frase vieja'), texto: 'Old line' },
        guion_corto: { hash: fieldHash('Texto'), texto: 'Text' },
      },
    })
  );
  const room = { room_id: 'sala-01', nombre_oficial: 'Sala Mexica' };
  const r = applyStoredTranslations(root, [piece], [room]);
  assert.deepEqual(r, { en: { applied: 1, stale: 1 } });
  assert.equal(piece.titulo_en, 'Hoja manda'); // una celda con texto en la hoja gana
  assert.equal('frase_gancho_en' in piece, false); // el español cambió: no se usa la vieja
  assert.equal(piece.guion_corto_en, 'Text');
  assert.equal('guion_largo_en' in piece, false);
  assert.equal('nombre_oficial_en' in room, false);
});

test('unir traducciones: archivos dañados se ignoran sin romper la publicación', () => {
  const root = makeRoot(1);
  const dir = path.join(root, 'traducciones/en');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pieza_p00.json'), '{ esto no es json');
  const piece = { piece_id: 'p00', titulo: 'Pieza 0' };
  assert.deepEqual(applyStoredTranslations(root, [piece], []), { en: { applied: 0, stale: 0 } });
  assert.equal('titulo_en' in piece, false);
});

test('costo: se calcula con lo que informa la API', () => {
  assert.equal(usdFromUsage({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 }), 12);
});

test('las reglas del traductor incluyen las decisiones de Alberto (AD/BC, ortografía del glosario, comillas)', () => {
  const sys = buildSystemPrompt('en');
  assert.ok(sys.includes('"d.C." becomes "AD"') && sys.includes('"a.C." becomes "BC"'));
  assert.ok(!sys.includes('BCE') && !sys.includes('"CE"'));
  assert.ok(sys.includes('use the glossary spelling'));
  assert.ok(sys.includes('typographic quotation marks'));
  assert.ok(sys.includes('"the Maya"') && sys.includes('Write "Mexico" without an accent'));
  assert.ok(sys.includes('"Mito:" and "Realidad:"') && sys.includes('"Myth:" and "Reality:"'));
});

test('respuesta cortada por límite de largo: se reintenta con el doble de espacio y se cuenta lo cobrado', async () => {
  const root = makeRoot(1);
  const ok = okReply({ input_tokens: 1000, output_tokens: 500 });
  const cut = { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"titulo":"Pie' }], usage: { input_tokens: 1000, output_tokens: 3000 }, stop_reason: 'max_tokens' }), text: async () => '' };
  const { fetchImpl, calls } = fakeApi((body, n) => (n === 1 ? cut : ok(body)));
  const lines = [];
  const code = await main(['--generar', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl, log: (l) => lines.push(l), warn: () => {} });
  assert.equal(code, 0);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.max_tokens, calls[0].body.max_tokens * 2);
  assert.equal(files(root).length, 1);
  // 1.º intento: 1000 de entrada y 3000 de salida; 2.º: 1000 y 500 → 0.002*2 + (3500*10)/1e6 = 0.039
  assert.ok(lines.join('\n').includes('US$ 0.039'), lines.join('\n'));
});

test('el espacio para la respuesta es amplio (casi el doble de lo medido) y nunca pasa de 16000', async () => {
  const root = makeRoot(1);
  const { fetchImpl, calls } = fakeApi(okReply());
  await main(['--generar', '--solo', 'piezas'], { root, env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl, ...quiet });
  const chars = JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'))[0]).length;
  assert.ok(calls[0].body.max_tokens >= chars * 0.5 * 1.5, `max_tokens ${calls[0].body.max_tokens} para ${chars} caracteres`);
  assert.ok(calls[0].body.max_tokens <= 16000);
});

// ---------------------------------------------------------------------------
// Francés
// ---------------------------------------------------------------------------
test('francés: el glosario usa su propia columna y omite lo que no tiene decisión', () => {
  const file = path.join(makeRoot(1), 'glosario/glosario.csv');
  const fr = loadGlossary(file, 'fr');
  const byEs = (es) => fr.find((g) => g.es === es);
  assert.equal(byEs('Posclásico Tardío').en, 'Postclassique récent');
  assert.equal(byEs('Tláloc').keep, true);
  assert.equal(byEs('Olmeca / Olmecas').keep, false);
  assert.equal(byEs('Dios Raro'), undefined, 'sin francés: no se usa');
  assert.equal(byEs('Puréecherio'), undefined, 'revisar: no se usa');
  assert.equal(loadGlossary(file, 'en').find((g) => g.es === 'Posclásico Tardío').en, 'Late Postclassic');
  assert.equal(loadGlossary(file, 'en').find((g) => g.es === 'Dios Raro').en, 'Weird God');
});

test('francés: las reglas traen las decisiones (vous, apr. J.-C., comillas, Mexico/Mexique)', () => {
  const p = buildSystemPrompt('fr');
  for (const must of ['French (France)', 'vous', 'apr. J.-C.', 'av. J.-C.', '« »', 'Mythe :', 'Réalité :', 'Salle X', 'le Mexique', 'Toltèque']) assert.ok(p.includes(must), `falta: ${must}`);
  assert.ok(!p.includes('Myth:'));
  assert.ok(buildSystemPrompt('en').includes('Myth:'), 'el inglés no cambia');
});

test('francés: "de", "la", "en" no cuentan como español, pero el español real sí se detecta', () => {
  const src = { guion_corto: 'La piedra del Sol fue tallada por los mexicas en el siglo XV y está dedicada a la creación del mundo.' };
  const FR = 'La Pierre du Soleil a été taillée par les Mexicas au XVe siècle et elle est dédiée à la création du monde, en pleine capitale.';
  assert.deepEqual(validateTranslation(src, { guion_corto: FR }, [], { lang: 'fr' }).errors, []);
  const ES_LEFT = 'La piedra del Sol fue tallada por los mexicas con una fuerza que sus visitantes sienten, pero también con una belleza como pocas.';
  const r = validateTranslation(src, { guion_corto: ES_LEFT }, [], { lang: 'fr' });
  assert.ok(r.errors.some((e) => /español/.test(e)), JSON.stringify(r));
});

test('francés: números con espacio o coma cuentan; nombres que se quedan igual aceptan plural', () => {
  const src = { guion_corto: 'Pesa 24 toneladas, mide 3.58 m y se talló en 1521. Los mexica la veneraban, junto con 12,000 objetos más.' };
  const g = loadGlossary(path.join(makeRoot(1), 'glosario/glosario.csv'), 'fr');
  const ok = { guion_corto: 'Elle pèse 24 tonnes, mesure 3,58 m et fut taillée en 1521. Les Mexicas la vénéraient, avec 12 000 objets de plus.' };
  const r = validateTranslation(src, ok, glossaryFor(g, [src.guion_corto]), { lang: 'fr' });
  assert.deepEqual(r.warnings, {}, JSON.stringify(r));
  const bad = { guion_corto: 'Elle pèse 24 tonnes et fut taillée en 1521. Les Aztèques la vénéraient.' };
  const r2 = validateTranslation(src, bad, glossaryFor(g, [src.guion_corto]), { lang: 'fr' });
  assert.ok(r2.warnings.guion_corto.some((w) => /3\.58/.test(w)) && r2.warnings.guion_corto.some((w) => /Mexica/.test(w)), JSON.stringify(r2));
});

test('francés: corrida de prueba guarda en traducciones/fr y se une como campo_fr', async () => {
  const root = makeRoot(2);
  const out = [];
  const code = await main(['--lang', 'fr', '--proveedor', 'prueba', '--generar', '--limite', '2', '--solo', 'piezas'], { root, env: {}, log: (m) => out.push(m), warn: () => {} });
  assert.equal(code, 0);
  const file = path.join(root, 'traducciones/fr/pieza_p00.json');
  assert.ok(fs.existsSync(file));
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf-8')).idioma, 'fr');
  assert.ok(!fs.existsSync(path.join(root, 'traducciones/en')));
  const pieces = JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'));
  const r = applyStoredTranslations(root, pieces, [], ['fr']);
  assert.ok(r.fr.applied > 0);
  assert.ok(pieces[0].guion_corto_fr);
  assert.ok(!pieces[0].guion_corto_en);
});

test('francés: el estimado es más alto que el del inglés (supuesto, sin medir)', async () => {
  const { estimateUnit } = await import('../traducir-lib.mjs');
  const f = { guion_largo: 'x'.repeat(4000) };
  assert.ok(estimateUnit(f, [], 'fr').usd > estimateUnit(f, [], 'en').usd);
});

test('nombres propios con "El" o "de la" en una ficha corta no se confunden con español sin traducir', () => {
  const src = { especificaciones: { Cultura: 'Centro de Veracruz (El Zapotal / Mixtequilla)', Procedencia: 'El Zapotal, Ignacio de la Llave, Veracruz', Medidas: '1.48 m de alto x 0.65 m de ancho' } };
  const out = { especificaciones: { Culture: 'Central Veracruz (El Zapotal / Mixtequilla)', Origin: 'El Zapotal, Ignacio de la Llave, Veracruz', Dimensions: '1.48 m high x 0.65 m wide' } };
  assert.deepEqual(validateTranslation(src, out, [], { lang: 'en' }).errors, []);
});

test('glosario: si un término tiene dos filas (pueblo y sala) basta con cumplir una', () => {
  const file = path.join(makeRoot(1), 'glosario/glosario.csv');
  fs.appendFileSync(file, 'Pueblos,traducir,Nahuas,Nahua,10,,Nahuas\nSalas,traducir,Nahuas,Nahua Peoples,2,,Peuples nahuas\n');
  const g = loadGlossary(file, 'en');
  const src = { guion_corto: 'Los nahuas veneraban a Tláloc desde mucho antes de la llegada de los españoles a estas tierras fértiles.' };
  const out = { guion_corto: 'The Nahua revered Tláloc long before the Spanish arrived in these fertile lands, and they kept the tradition alive for centuries.' };
  assert.deepEqual(validateTranslation(src, out, glossaryFor(g, [src.guion_corto]), { lang: 'en' }).warnings, {});
});

// ---------------------------------------------------------------------------
// Modo por lotes
// ---------------------------------------------------------------------------
const ENVK = { ANTHROPIC_API_KEY: 'clave-falsa' };
const jsonRes = (data) => ({ ok: true, json: async () => data, text: async () => JSON.stringify(data) });

/** API de lotes de mentiras. results(cid, body) devuelve el resultado de cada petición. */
function fakeBatchApi({ status = 'ended', results = null } = {}) {
  const calls = [];
  let created = null;
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url === 'https://api.anthropic.com/v1/messages/batches' && init.method === 'POST') {
      created = JSON.parse(init.body);
      return jsonRes({ id: 'msgbatch_123', processing_status: 'in_progress' });
    }
    if (url.endsWith('/results')) {
      const lines = await Promise.all(created.requests.map(async (r) => JSON.stringify({ custom_id: r.custom_id, result: await results(r) })));
      return { ok: true, text: async () => lines.join('\n') + '\n' };
    }
    return jsonRes({ id: 'msgbatch_123', processing_status: typeof status === 'function' ? status() : status, request_counts: { processing: 0, succeeded: 1 } });
  };
  return { fetchImpl, calls, created: () => created };
}
const okResult = (usage = { input_tokens: 1000, output_tokens: 500 }) => async (req) => {
  const text = (await okReply(usage)({ messages: req.params.messages }).json()).content[0].text;
  return { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text }], usage } };
};

test('lote: enviar manda todas las unidades en una petición y anota el lote', async () => {
  const root = makeRoot(3);
  const api = fakeBatchApi();
  const code = await main(['--lote', 'enviar', '--generar', '--limite', '10', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: api.fetchImpl, ...quiet });
  assert.equal(code, 0);
  assert.equal(api.calls.length, 1);
  const c = api.calls[0];
  assert.equal(c.init.headers['x-api-key'], 'clave-falsa');
  assert.equal(c.init.headers['anthropic-version'], '2023-06-01');
  const reqs = api.created().requests;
  assert.deepEqual(reqs.map((r) => r.custom_id), ['pieza_p00', 'pieza_p01', 'pieza_p02']);
  assert.equal(reqs[0].params.model, 'claude-sonnet-5-5');
  assert.equal(reqs[0].params.system[0].cache_control.type, 'ephemeral');
  assert.ok(reqs[0].params.max_tokens >= 4000);
  const lote = JSON.parse(fs.readFileSync(path.join(root, 'traducciones/en/_lote.json'), 'utf-8'));
  assert.equal(lote.id, 'msgbatch_123');
  assert.equal(lote.unidades.length, 3);
  assert.equal(files(root).length, 0, 'todavía no hay traducciones guardadas');
});

test('lote: sin --generar solo muestra el plan; con un lote en curso no deja enviar otro', async () => {
  const root = makeRoot(2);
  await main(['--lote', 'enviar', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: noNetwork, ...quiet });
  assert.ok(!fs.existsSync(path.join(root, 'traducciones/en/_lote.json')));
  const api = fakeBatchApi();
  await main(['--lote', 'enviar', '--generar', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: api.fetchImpl, ...quiet });
  await assert.rejects(() => main(['--lote', 'enviar', '--generar', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: noNetwork, ...quiet }), /Ya hay un lote en curso/);
});

test('lote: el tope en dólares recorta lo que se manda (con el descuento del 50 %)', async () => {
  const root = makeRoot(6);
  const plan = [];
  await main(['--lote', 'enviar', '--limite', '6', '--solo', 'piezas', '--max-usd', '100'], { root, env: ENVK, fetchImpl: noNetwork, log: (m) => plan.push(m), warn: () => {} });
  const per = parseFloat(plan.join('\n').match(/Con el modo por lotes \(50 % de descuento\): US\$ ([\d.]+)/)[1]) / 6;
  const api = fakeBatchApi();
  await main(['--lote', 'enviar', '--generar', '--limite', '6', '--solo', 'piezas', '--max-usd', String(per * 2.5)], { root, env: ENVK, fetchImpl: api.fetchImpl, ...quiet });
  assert.equal(api.created().requests.length, 2);
});

test('lote: recoger guarda lo que pasa las revisiones, descarta lo demás y cobra la mitad', async () => {
  const root = makeRoot(3);
  await main(['--lote', 'enviar', '--generar', '--solo', 'piezas', '--limite', '3'], { root, env: ENVK, fetchImpl: fakeBatchApi().fetchImpl, ...quiet });
  const good = okResult({ input_tokens: 1_000_000, output_tokens: 0 });
  const api = fakeBatchApi({
    results: async (req) => {
      if (req.custom_id === 'pieza_p01') return { type: 'errored', error: { error: { message: 'boom' } } };
      if (req.custom_id === 'pieza_p02') return { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"titulo":"Piece"}' }], usage: { input_tokens: 0, output_tokens: 0 } } };
      return good(req);
    },
  });
  // el lote se "creó" en otra corrida: se vuelve a armar el mismo contenido para que la API de mentiras tenga las peticiones
  await api.fetchImpl('https://api.anthropic.com/v1/messages/batches', { method: 'POST', body: JSON.stringify({ requests: [0, 1, 2].map((i) => ({ custom_id: `pieza_p0${i}`, params: { messages: [{ role: 'user', content: buildUserPromptFor(root, i) }] } })) }) });
  const out = [];
  const code = await main(['--lote', 'recoger', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: api.fetchImpl, log: (m) => out.push(m), warn: (m) => out.push(m) });
  assert.equal(code, 0);
  assert.deepEqual(files(root), ['pieza_p00.json']);
  assert.ok(!fs.existsSync(path.join(root, 'traducciones/en/_lote.json')), 'el lote terminado se borra');
  const text = out.join('\n');
  assert.match(text, /1 traducidas, 2 con error/);
  assert.match(text, /pieza p01 … ERROR: errored/);
  assert.match(text, /no pasó las revisiones/);
  // 1 millón de tokens de entrada a US$ 2 el millón, con 50 % de descuento = US$ 1.00
  assert.match(text, /US\$ 1\.00/);
});

function buildUserPromptFor(root, i) {
  const p = JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'))[i];
  return 'x' + JSON.stringify(sourceFields('pieza', p));
}

test('lote: recoger sin terminar deja el lote anotado; con --esperar vuelve a preguntar', async () => {
  const root = makeRoot(1);
  await main(['--lote', 'enviar', '--generar', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: fakeBatchApi().fetchImpl, ...quiet });
  let n = 0;
  const api = fakeBatchApi({ status: () => (++n >= 3 ? 'ended' : 'in_progress'), results: okResult() });
  await api.fetchImpl('https://api.anthropic.com/v1/messages/batches', { method: 'POST', body: JSON.stringify({ requests: [{ custom_id: 'pieza_p00', params: { messages: [{ role: 'user', content: buildUserPromptFor(root, 0) }] } }] }) });
  n = 0;
  await main(['--lote', 'recoger'], { root, env: ENVK, fetchImpl: api.fetchImpl, pollMs: 0, ...quiet });
  assert.ok(fs.existsSync(path.join(root, 'traducciones/en/_lote.json')), 'sigue pendiente');
  assert.equal(files(root).length, 0);
  n = 0;
  await main(['--lote', 'recoger', '--esperar', '5'], { root, env: ENVK, fetchImpl: api.fetchImpl, pollMs: 0, ...quiet });
  assert.deepEqual(files(root), ['pieza_p00.json']);
});

test('lote: si el texto en español cambió mientras tanto, esa traducción se descarta', async () => {
  const root = makeRoot(1);
  await main(['--lote', 'enviar', '--generar', '--solo', 'piezas'], { root, env: ENVK, fetchImpl: fakeBatchApi().fetchImpl, ...quiet });
  const api = fakeBatchApi({ results: okResult() });
  await api.fetchImpl('https://api.anthropic.com/v1/messages/batches', { method: 'POST', body: JSON.stringify({ requests: [{ custom_id: 'pieza_p00', params: { messages: [{ role: 'user', content: buildUserPromptFor(root, 0) }] } }] }) });
  const f = path.join(root, 'public/data/pieces.json');
  const pieces = JSON.parse(fs.readFileSync(f, 'utf-8'));
  pieces[0].guion_corto += ' Texto nuevo.';
  fs.writeFileSync(f, JSON.stringify(pieces));
  const out = [];
  await main(['--lote', 'recoger'], { root, env: ENVK, fetchImpl: api.fetchImpl, log: (m) => out.push(m), warn: (m) => out.push(m) });
  assert.equal(files(root).length, 0);
  assert.match(out.join('\n'), /no es el que se mandó/);
});

test('lote: opciones inválidas', () => {
  assert.throws(() => parseArgs(['--lote', 'x']), /enviar o recoger/);
  assert.throws(() => parseArgs(['--lote', 'enviar', '--proveedor', 'prueba']), /solo funciona con el proveedor claude/);
  assert.throws(() => parseArgs(['--esperar', '-1']), /entre 0 y 1440/);
});

test('francés: el apóstrofo recto del glosario y el tipográfico del texto cuentan como lo mismo', () => {
  const file = path.join(makeRoot(1), 'glosario/glosario.csv');
  fs.appendFileSync(file, "Museo,traducir,Museo Nacional de Antropología,National Museum of Anthropology,5,,Musée national d'anthropologie\n");
  const g = loadGlossary(file, 'fr');
  const src = { guion_corto: 'El Museo Nacional de Antropología resguarda esta pieza desde hace décadas, y recibe millones de visitantes cada año.' };
  const out = { guion_corto: 'Le Musée national d’anthropologie conserve cette pièce depuis des décennies et accueille des millions de visiteurs chaque année.' };
  assert.deepEqual(validateTranslation(src, out, glossaryFor(g, [src.guion_corto]), { lang: 'fr' }).warnings, {});
});

test('respuesta con texto y llaves después del JSON: se toma el primer objeto completo', async () => {
  const { parseJsonReply } = await import('../traducir-lib.mjs');
  assert.deepEqual(parseJsonReply('```json\n{"a":"x } y","b":["{"]}\n```\nNota: {fin}'), { a: 'x } y', b: ['{'] });
  assert.deepEqual(parseJsonReply('{"a":"comillas \\" y llave }"} extra {otro}'), { a: 'comillas " y llave }' });
  assert.throws(() => parseJsonReply('sin json'), /no trae un objeto/);
});

test('un campo que el traductor renombró (titulo → titre) se corrige por posición', async () => {
  const { alignKeys } = await import('../traducir-lib.mjs');
  const src = { titulo: 'a', frase_gancho: 'b', guion_corto: 'c' };
  assert.deepEqual(alignKeys(src, { titre: 'A', frase_gancho: 'B', guion_corto: 'C' }), { titulo: 'A', frase_gancho: 'B', guion_corto: 'C' });
  // si no cuadra no se toca: la revisión lo rechaza
  const extra = { titre: 'A', frase_gancho: 'B', guion_corto: 'C', otro: 'D' };
  assert.equal(alignKeys(src, extra), extra);
  const dup = { titre: 'A', otro: 'B', guion_corto: 'C' };
  assert.deepEqual(Object.keys(alignKeys(src, dup)).sort(), ['frase_gancho', 'guion_corto', 'titulo']);
  assert.ok(buildSystemPrompt('fr').includes('never translate or rename'));
  assert.ok(buildSystemPrompt('en').includes('never translate or rename'));
});

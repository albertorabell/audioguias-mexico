// Pruebas de la lista de pronunciaciones. Se corren con:  node --test scripts/tests/pronunciacion.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadPronunciations, toSsmlInner, pronunciationElement } from '../pronunciacion-lib.mjs';

function csv(body) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pron-')), 'pronunciacion.csv');
  fs.writeFileSync(f, body);
  return f;
}
const FILE = csv(`idioma,palabra,tipo,valor,nota
# comentario que se ignora

es,Mexica,alias,Meshica,
es,Mexicas,alias,Meshicas,plural
es,Xochipilli,ipa,"ʃotʃiˈpili",
fr,Mexica,alias,Mexika,
es,Rara,otro,x,tipo desconocido
es,SinValor,alias,,
`);

test('lee solo filas válidas, ignora comentarios y filtra por idioma', () => {
  const es = loadPronunciations(FILE, 'es');
  assert.deepEqual(es.map((e) => e.word), ['Mexica', 'Mexicas', 'Xochipilli']);
  assert.equal(es[2].value, 'ʃotʃiˈpili');
  assert.deepEqual(loadPronunciations(FILE, 'fr').map((e) => e.value), ['Mexika']);
  assert.equal(loadPronunciations(FILE).length, 4);
  assert.deepEqual(loadPronunciations('/no/existe.csv', 'es'), []);
});

test('aplica la pronunciación a palabras completas, sin importar mayúsculas, y conserva el texto original', () => {
  const es = loadPronunciations(FILE, 'es');
  const out = toSsmlInner('Los mexicas y la cultura Mexica; Xochipilli, no "Mexicanos".', es);
  assert.ok(out.includes('<sub alias="Meshicas">mexicas</sub>'), out);
  assert.ok(out.includes('<sub alias="Meshica">Mexica</sub>'), out);
  assert.ok(out.includes('<phoneme alphabet="ipa" ph="ʃotʃiˈpili">Xochipilli</phoneme>'), out);
  assert.ok(out.includes('Mexicanos') && !out.includes('>Mexicanos<'), 'una palabra distinta no se toca');
  assert.ok(out.includes('&quot;'), 'el resto del texto va escapado');
});

test('sin lista solo escapa; el texto con & y < no rompe el SSML', () => {
  assert.equal(toSsmlInner('A & B < C', []), 'A &amp; B &lt; C');
  assert.equal(pronunciationElement('alias', 'a"b', 'x&y'), '<sub alias="a&quot;b">x&amp;y</sub>');
});

test('lang y voz: cambian el idioma o la voz solo para esa palabra, y el SSML queda bien cerrado', () => {
  assert.equal(pronunciationElement('lang', 'en-US=meshicas', 'mexicas'), '<lang xml:lang="en-US">meshicas</lang>');
  assert.equal(
    pronunciationElement('voz', 'en-US-AvaMultilingualNeural=meshicas', 'mexicas', 'es-MX-DaliaNeural'),
    '</voice><voice name="en-US-AvaMultilingualNeural">meshicas</voice><voice name="es-MX-DaliaNeural">'
  );
  assert.throws(() => pronunciationElement('voz', 'sin-igual', 'x', 'v'), /mal escrita/);
  assert.throws(() => pronunciationElement('lang', 'en-US=', 'x'), /mal escrita/);
  assert.throws(() => pronunciationElement('voz', 'a=b', 'x'), /voz principal/);
  const f = csv('idioma,palabra,tipo,valor,nota\nes,mexicas,voz,en-US-AvaMultilingualNeural=meshicas,\n');
  const inner = toSsmlInner('Los mexicas y los mexicas.', loadPronunciations(f, 'es'), 'es-MX-DaliaNeural');
  const ssml = `<speak><voice name="es-MX-DaliaNeural">${inner}</voice></speak>`;
  assert.equal((ssml.match(/<voice /g) || []).length, (ssml.match(/<\/voice>/g) || []).length);
  assert.ok(ssml.includes('<voice name="en-US-AvaMultilingualNeural">meshicas</voice>'));
});

test('la lista real de inglés: todas las filas son válidas y las palabras mexicanas se leen con acento de México', async () => {
  const { loadPronunciations, toSsmlInner } = await import('../pronunciacion-lib.mjs');
  const en = loadPronunciations('glosario/pronunciacion.csv', 'en');
  assert.ok(en.length > 100, `se esperaban más de 100 palabras y hay ${en.length}`);
  for (const e of en.filter((x) => x.kind === 'lang' && !/^mexicas?$/i.test(x.word))) assert.match(e.value, /^es-MX=.+/, e.word);
  assert.equal(new Set(en.map((e) => e.word.toLowerCase())).size, en.length, 'hay palabras repetidas');
  const out = toSsmlInner('The Mexica of Tenochtitlan honored Tláloc at Monte Albán.', en, 'es-MX-JorgeMultilingualNeural');
  assert.match(out, /<lang xml:lang="en-US">Mesheeka<\/lang>/);
  assert.match(out, /<lang xml:lang="es-MX">Tenochtitlan<\/lang>/);
  assert.match(out, /<lang xml:lang="es-MX">Tláloc<\/lang>/);
  assert.match(out, /<lang xml:lang="es-MX">Monte Albán<\/lang>/, 'las palabras de dos partes se leen juntas');
});

test('la lista real de francés: filas válidas, mismas reglas que inglés y sin Mexica (se prueba de oído)', async () => {
  const { loadPronunciations, toSsmlInner } = await import('../pronunciacion-lib.mjs');
  const fr = loadPronunciations('glosario/pronunciacion.csv', 'fr');
  assert.ok(fr.length > 100, `se esperaban más de 100 palabras y hay ${fr.length}`);
  for (const e of fr) assert.match(e.value, /^es-MX=.+/, e.word);
  assert.equal(new Set(fr.map((e) => e.word.toLowerCase())).size, fr.length, 'hay palabras repetidas');
  assert.equal(fr.some((e) => /^mexicas?$/i.test(e.word)), false);
  const out = toSsmlInner('Les Mexicas vénéraient Tláloc à Teotihuacán.', fr, 'es-MX-JorgeMultilingualNeural');
  assert.match(out, /<lang xml:lang="es-MX">Tláloc<\/lang>/);
  assert.match(out, /Les Mexicas vénéraient/);
});

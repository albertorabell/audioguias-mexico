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

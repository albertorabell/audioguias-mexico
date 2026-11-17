import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMS, CONTACT, SELLER } from '../../src/i18n/terminos.js';
import { IDIOMAS } from '../seo-lib.mjs';

test('términos: están los 7 idiomas, con las mismas secciones y los datos de cobro reales', () => {
  const n = TERMS.es.blocks.length;
  for (const l of IDIOMAS) {
    const t = TERMS[l];
    assert.ok(t, l);
    assert.equal(t.blocks.length, n, `${l}: mismas secciones que en español`);
    const todo = t.blocks.map((b) => b[1]).join(' ');
    assert.ok(todo.includes(CONTACT), `${l}: lleva el correo de contacto`);
    assert.ok(/30/.test(t.blocks[2][1]), `${l}: pase de 30 días`);
    assert.ok(/2/.test(t.blocks[1][1]), `${l}: hasta 2 teléfonos`);
    assert.ok(!/72\s*(h|hour|heure|godzin|Stunde|hora|ore)/i.test(todo), `${l}: sin restos del pase de 72 horas`);
    assert.ok(t.seller.includes(SELLER), `${l}: vendedor`);
  }
});

test('privacidad: 7 idiomas con las mismas secciones y los plazos reales', async () => {
  const { PRIVACY } = await import('../../src/i18n/privacidad.js');
  const n = PRIVACY.es.blocks.length;
  for (const l of IDIOMAS) {
    const p = PRIVACY[l];
    assert.ok(p, l);
    assert.equal(p.blocks.length, n, `${l}: mismas secciones que en español`);
    const todo = p.blocks.map((b) => b[1]).join(' ');
    assert.ok(todo.includes(CONTACT), `${l}: lleva el correo de contacto`);
    assert.ok(/90/.test(todo) && /60/.test(todo), `${l}: plazos de 60 y 90 días`);
    assert.ok(/Resend/.test(todo) && /Stripe/.test(todo), `${l}: nombra a Stripe y Resend`);
  }
});

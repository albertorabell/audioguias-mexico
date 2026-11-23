import test from 'node:test';
import assert from 'node:assert/strict';

// Un localStorage mínimo para probar sin navegador
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { guardarParada, guardarPosicion, posicionPara, olvidarPosicion, leerRegistro } = await import('../../src/utils/reanudar.js');

test('reanudar: guarda parada, recorrido y segundo; ofrece continuar solo si hay algo útil', () => {
  mem.clear();
  guardarParada('MNA', 'ruta_1', 'mna_a');
  guardarPosicion('mna_a', 'expres', 5);
  assert.equal(posicionPara('mna_a', 'expres', 60), 0); // muy al principio
  guardarPosicion('mna_a', 'expres', 41.7);
  assert.equal(posicionPara('mna_a', 'expres', 60), 41);
  assert.equal(posicionPara('mna_a', 'inmersion', 60), 0); // otra versión del audio
  assert.equal(posicionPara('mna_a', 'expres', 45), 0); // ya casi al final
  assert.equal(leerRegistro().r, 'ruta_1');
});

test('reanudar: otra parada empieza de cero; terminar la parada borra el segundo; caduca a las 12 h', () => {
  mem.clear();
  guardarParada('MNA', '', 'a');
  guardarPosicion('a', 'expres', 30);
  guardarParada('MNA', '', 'b');
  assert.equal(posicionPara('b', 'expres', 100), 0);
  guardarPosicion('b', 'expres', 30);
  olvidarPosicion('b');
  assert.equal(posicionPara('b', 'expres', 100), 0);
  guardarPosicion('b', 'expres', 30);
  assert.equal(leerRegistro(Date.now() + 13 * 3600 * 1000), null);
  guardarPosicion('zzz', 'expres', 50); // de otra parada: se ignora
  assert.equal(leerRegistro().t, 30);
});

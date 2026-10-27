// Solo para el ensayo automático (CI): crea datos-privados/piezas-completas.json con textos INVENTADOS.
// Los textos reales de pago no están en el repositorio (es público); sin este archivo el ensayo de audios no tendría qué leer.
import fs from 'node:fs';
import path from 'node:path';
import { PRIVATE_DIR } from './privado-lib.mjs';

const root = path.resolve(import.meta.dirname, '..');
const publicas = JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'));
const completas = publicas.map((p) => ({
  ...p,
  guion_corto: `Texto corto de prueba de ${p.titulo}. Es una introducción breve para escuchar en un minuto.`,
  guion_largo: `Texto largo de prueba de ${p.titulo}. Aquí va el desarrollo completo de la pieza, con varias frases para poder leerlo. Fin del texto largo.`,
}));
fs.mkdirSync(path.join(root, PRIVATE_DIR), { recursive: true });
fs.writeFileSync(path.join(root, PRIVATE_DIR, 'piezas-completas.json'), JSON.stringify(completas, null, 2));
console.log(`Datos de ensayo: ${completas.length} piezas con texto inventado.`);

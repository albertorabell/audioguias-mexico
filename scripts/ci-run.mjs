// scripts/ci-run.mjs
// Ejecuta un comando y deja su registro (log) como anotaciones de GitHub,
// para poder leer los errores sin abrir el sitio de GitHub.
// Uso: node scripts/ci-run.mjs "<nombre del paso>" -- comando args...
import { spawnSync } from 'node:child_process';

const sep = process.argv.indexOf('--');
const name = process.argv[2] || 'paso';
const cmd = process.argv.slice(sep + 1);
const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: false });
const out = `${r.stdout || ''}${r.stderr || ''}`;
process.stdout.write(out);

const esc = (s) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const lines = out.split('\n');
// Se guardan las últimas ~28000 caracteres en hasta 9 anotaciones (límite de GitHub: 10 por paso).
const MAX_ANN = 9, CHUNK = 3000;
let text = lines.join('\n');
if (text.length > MAX_ANN * CHUNK) text = '[…recortado…]\n' + text.slice(-MAX_ANN * CHUNK);
const parts = [];
for (let i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));
parts.forEach((p, i) => {
  console.log(`::notice title=LOG ${name} ${i + 1}/${parts.length} (código ${r.status})::${esc(p)}`);
});
process.exit(r.status === null ? 1 : r.status);

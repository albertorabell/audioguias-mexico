// Resumen de uso en español, a partir de /estadisticas del servidor de cobro.
// Uso:  PAGOS_API_URL=... STATS_KEY=... node scripts/resumen-uso.mjs [dias]
// Escribe en pantalla (y en el resumen de GitHub Actions si existe GITHUB_STEP_SUMMARY).
import fs from 'node:fs';

export function resumir(conteos, dias) {
  const tot = {};
  const porObra = {};
  const porIdioma = {};
  const audioPorTipo = { mp3: 0, voz: 0 };
  for (const dia of Object.values(conteos || {})) {
    for (const [clave, n] of Object.entries(dia)) {
      if (clave === '_descartados') continue;
      const [e, , p, l, m, k] = clave.split('|');
      tot[e] = (tot[e] || 0) + n;
      if (e === 'piece_view' && p) porObra[p] = (porObra[p] || 0) + n;
      if (e === 'app_open' && l) porIdioma[l] = (porIdioma[l] || 0) + n;
      if (e === 'audio_play') audioPorTipo[k === 'voz' ? 'voz' : 'mp3'] += n;
    }
  }
  const top = Object.entries(porObra).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const lineas = [
    `# Uso de la app (últimos ${dias} días)`,
    '',
    `- Veces que se abrió la app: **${tot.app_open || 0}**`,
    `- Obras vistas: **${tot.piece_view || 0}**`,
    `- Audios reproducidos: **${tot.audio_play || 0}** (voz buena: ${audioPorTipo.mp3}, voz del teléfono: ${audioPorTipo.voz}) · terminados: ${tot.audio_end || 0}`,
    `- Veces que se abrió la pantalla del pase: **${tot.paywall_open || 0}**`,
    `- Pagos iniciados: **${tot.checkout_start || 0}** · compras confirmadas: **${tot.purchase || 0}** · reembolsos/disputas: ${tot.refund || 0}`,
    `- Cambios de idioma: ${tot.lang_change || 0} · recorridos iniciados: ${tot.route_start || 0} · terminados: ${tot.tour_done || 0}`,
    `- Descargas sin internet: ${tot.offline_download || 0} · app instalada: ${tot.install || 0} · búsquedas: ${tot.search || 0}`,
    '',
    '## Obras más vistas',
    ...(top.length ? top.map(([id, n], i) => `${i + 1}. ${id} — ${n}`) : ['(todavía no hay datos)']),
    '',
    '## Idioma al abrir la app',
    ...(Object.keys(porIdioma).length ? Object.entries(porIdioma).sort((a, b) => b[1] - a[1]).map(([l, n]) => `- ${l}: ${n}`) : ['(todavía no hay datos)']),
    '',
    '_Son conteos aproximados y anónimos: no se guarda nada que identifique a una persona._',
  ];
  return lineas.join('\n');
}

async function main() {
  const base = String(process.env.PAGOS_API_URL || '').replace(/\/+$/, '');
  const key = process.env.STATS_KEY;
  const dias = Math.min(Math.max(parseInt(process.argv[2] || process.env.DIAS || '30', 10) || 30, 1), 90);
  if (!base || !key) {
    console.error('Faltan PAGOS_API_URL (variable) o STATS_KEY (secreto) en GitHub.');
    process.exit(1);
  }
  const res = await fetch(`${base}/estadisticas?dias=${dias}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    console.error(`El servidor respondió ${res.status}. ¿Está bien STATS_KEY y ya publicaste el servidor de cobro?`);
    process.exit(1);
  }
  const { conteos } = await res.json();
  const texto = resumir(conteos, dias);
  console.log(texto);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texto + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main();

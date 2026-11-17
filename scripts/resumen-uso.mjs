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
  const porOrigen = {};
  const porAliado = {};
  const primerAudio = {};
  const rutaParadas = {};
  const muestraGuias = {};
  const porSitio = { app_open: {}, audio_play: {}, paywall_open: {}, checkout_start: {}, purchase: {} };
  for (const dia of Object.values(conteos || {})) {
    for (const [clave, n] of Object.entries(dia)) {
      const [e, s, p, , , k] = clave.split('|');
      if (e === 'app_open' && k) porOrigen[k] = (porOrigen[k] || 0) + n;
      if (e === 'ally_visit' && k) porAliado[k] = (porAliado[k] || 0) + n;
      if (e === 'first_audio' && k) primerAudio[k] = (primerAudio[k] || 0) + n;
      if (e === 'guide_sample') {
        const clave = [s, p].filter(Boolean).join(' / ') || '(sin dato)';
        muestraGuias[clave] = (muestraGuias[clave] || 0) + n;
      }
      if (e === 'route_stop' && p) {
        rutaParadas[p] = rutaParadas[p] || {};
        rutaParadas[p][k] = (rutaParadas[p][k] || 0) + n;
      }
      if (porSitio[e] && s) porSitio[e][s] = (porSitio[e][s] || 0) + n;
    }
  }
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '—');
  const lista = (obj, orden) => {
    const ent = Object.entries(obj).sort(orden || ((a, b) => b[1] - a[1]));
    return ent.length ? ent.map(([k, n]) => `- ${k}: ${n}`) : ['(todavía no hay datos)'];
  };
  const sitios = [...new Set(Object.values(porSitio).flatMap((o) => Object.keys(o)))].sort();
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
    '## Embudo (de la visita a la compra)',
    `1. Visitas (app abierta): **${tot.app_open || 0}**`,
    `2. Primer audio: **${tot.first_audio || 0}** (${pct(tot.first_audio || 0, tot.app_open || 0)} de las visitas)`,
    `3. Terminaron una parada gratis: **${tot.free_end || 0}** (${pct(tot.free_end || 0, tot.first_audio || 0)} de los primeros audios)`,
    `4. Tocaron una parada de pago: **${tot.paywall_block || 0}** · vieron el precio: **${tot.paywall_open || 0}**`,
    `5. Abrieron el pago: **${tot.checkout_start || 0}** (${pct(tot.checkout_start || 0, tot.paywall_open || 0)} de quienes vieron el precio)`,
    `6. Pagaron: **${tot.purchase || 0}** (${pct(tot.purchase || 0, tot.checkout_start || 0)} de quienes abrieron el pago)`,
    `- Errores de audio: ${tot.audio_error || 0} · errores de la app: ${tot.app_error || 0}`,
    '',
    '## Tiempo hasta el primer audio (segundos, por tramos)',
    ...lista(primerAudio, (a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)),
    '',
    '## De dónde llegan',
    ...lista(porOrigen),
    '',
    '## Botón «Escuchar 30 s» de las guías (toques, por sitio / pieza)',
    ...lista(muestraGuias),
    '',
    '## Aliados y QR (etiqueta del enlace)',
    ...lista(porAliado),
    '',
    '## Por sitio (aperturas · audios · vieron precio · abrieron pago · compras)',
    ...(sitios.length ? sitios.map((x) => `- ${x}: ${porSitio.app_open[x] || 0} · ${porSitio.audio_play[x] || 0} · ${porSitio.paywall_open[x] || 0} · ${porSitio.checkout_start[x] || 0} · ${porSitio.purchase[x] || 0}`) : ['(todavía no hay datos)']),
    '',
    '## Rutas: cuántas veces se llegó a cada parada',
    ...(Object.keys(rutaParadas).length
      ? Object.entries(rutaParadas).flatMap(([r, ps]) => [`- ${r}: ` + Object.entries(ps).sort((a, b) => Number(a[0]) - Number(b[0])).map(([i, n]) => `parada ${i}: ${n}`).join(' · ')])
      : ['(todavía no hay datos)']),
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

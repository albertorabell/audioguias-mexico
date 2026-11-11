(function () {
  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var data = null, visits = null, messages = null, exact = false;

  $('api').value = store.get('panel_api');
  $('key').value = store.get('panel_key');

  function fmt(n) { return Number(n || 0).toLocaleString('es-MX'); }
  function pct(a, b) { return b ? (Math.round((a / b) * 1000) / 10).toLocaleString('es-MX') + ' %' : '–'; }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

  async function load() {
    var api = $('api').value.trim().replace(/\/+$/, '');
    var key = $('key').value.trim();
    var days = $('days').value;
    $('loginErr').hidden = true;
    var res;
    try {
      // Se piden el doble de días (hasta 400) para poder comparar con el periodo anterior
      res = await fetch(api + '/estadisticas?dias=' + Math.min(Number(days) * 2, 400), { headers: { Authorization: 'Bearer ' + key } });
    } catch (e) {
      return fail('No se pudo conectar con el servidor. Revisa la dirección.');
    }
    if (res.status === 401) return fail('La clave no es correcta.');
    if (!res.ok) return fail('El servidor respondió ' + res.status + '.');
    var body = await res.json();
    data = body.conteos || {};
    exact = !!body.exacto;
    visits = null;
    try {
      var vr = await fetch(api + '/recorridos?dias=' + Math.min(Number(days), 60), { headers: { Authorization: 'Bearer ' + key } });
      if (vr.ok) visits = (await vr.json()).conteos || {};
    } catch (e) { /* el servidor aún no tiene recorridos: la sección queda vacía */ }
    messages = null;
    try {
      var mr = await fetch(api + '/mensajes', { headers: { Authorization: 'Bearer ' + key } });
      if (mr.ok) messages = (await mr.json()).mensajes || [];
    } catch (e) { /* el servidor aún no tiene el formulario: la sección queda vacía */ }
    store.set('panel_api', api);
    store.set('panel_key', key);
    $('login').hidden = true;
    $('view').hidden = false;
    fillSites();
    render();
  }

  function fail(msg) { $('loginErr').textContent = msg; $('loginErr').hidden = false; $('login').hidden = false; $('view').hidden = true; }

  function isoDay(d) { return d.toISOString().slice(0, 10); }
  function shiftDay(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return isoDay(d); }
  // Primer día del periodo actual y del anterior (en UTC, como las cuentas del servidor)
  function periodStart() { return shiftDay(isoDay(new Date()), -(Number($('days').value) - 1)); }

  // Cada clave: evento|sitio|obra|idioma|modo|tipo
  function rows(prev) {
    var out = [];
    var start = periodStart(), prevStart = shiftDay(start, -Number($('days').value));
    Object.keys(data).sort().forEach(function (day) {
      if (prev ? (day >= start || day < prevStart) : day < start) return;
      Object.keys(data[day]).forEach(function (k) {
        if (k === '_descartados') return;
        var p = k.split('|');
        out.push({ day: day, e: p[0], s: p[1] || '', p: p[2] || '', l: p[3] || '', m: p[4] || '', k: p[5] || '', n: data[day][k] });
      });
    });
    return out;
  }

  function fillSites() {
    var seen = {};
    rows().forEach(function (r) { if (r.s) seen[r.s] = 1; });
    var sel = $('site'), cur = sel.value;
    sel.innerHTML = '<option value="">Todos</option>';
    Object.keys(seen).sort().forEach(function (s) { var o = el('option', s); o.value = s; sel.appendChild(o); });
    sel.value = cur;
  }

  function sum(rs, e) { return rs.filter(function (r) { return r.e === e; }).reduce(function (a, r) { return a + r.n; }, 0); }

  function render() {
    var site = $('site').value;
    var all = rows();
    var rs = site ? all.filter(function (r) { return r.s === site; }) : all;

    var tiles = [
      ['Aperturas de la app', sum(rs, 'app_open')],
      ['Visitantes nuevos', sum(rs, 'visitor_new')],
      ['Vieron el pase', sum(rs, 'paywall_open')],
      ['Iniciaron el pago', sum(rs, 'checkout_start')],
      ['Compras', sum(rs, 'purchase')],
      ['Entraron con código', sum(rs, 'code_redeem')],
      ['Reembolsos', sum(rs, 'refund')],
      ['Audios iniciados', sum(rs, 'audio_play')],
      ['App instalada', sum(rs, 'install')],
      ['Escucharon la muestra', sum(rs, 'sample_play')],
      ['Compartieron su código', sum(rs, 'pass_code_shared')],
      ['Errores de la app', sum(rs, 'app_error')]
    ];
    $('tiles').innerHTML = '';
    var before = site ? rows(true).filter(function (r) { return r.s === site; }) : rows(true);
    var evOf = { 'Aperturas de la app': 'app_open', 'Visitantes nuevos': 'visitor_new', 'Vieron el pase': 'paywall_open', 'Iniciaron el pago': 'checkout_start', 'Compras': 'purchase', 'Entraron con código': 'code_redeem', 'Reembolsos': 'refund', 'Audios iniciados': 'audio_play', 'App instalada': 'install', 'Escucharon la muestra': 'sample_play', 'Compartieron su código': 'pass_code_shared', 'Errores de la app': 'app_error' };
    tiles.forEach(function (t) {
      var d = el('div', undefined, 'card tile'); d.appendChild(el('b', fmt(t[1]))); d.appendChild(el('span', t[0]));
      var prevN = Number($('days').value) * 2 <= 400 ? sum(before, evOf[t[0]]) : 0; // con periodos largos no hay datos del anterior completos
      if (prevN > 0) {
        var change = Math.round(((t[1] - prevN) / prevN) * 100);
        var c = el('small', (change > 0 ? '▲ +' : change < 0 ? '▼ ' : '= ') + change + ' % vs periodo anterior', change > 0 ? 'up' : change < 0 ? 'down' : '');
        c.title = 'Periodo anterior: ' + fmt(prevN);
        d.appendChild(c);
      }
      $('tiles').appendChild(d);
    });

    // Visitantes que van llegando (gráficas)
    renderCharts(rs);

    // Embudo por sitio (siempre muestra todos los sitios; el filtro de arriba no aplica)
    var by = {};
    all.forEach(function (r) {
      var s = r.s || '(sin sitio)';
      var o = by[s] || (by[s] = { open: 0, pay: 0, co: 0, buy: 0, code: 0 });
      if (r.e === 'app_open') o.open += r.n;
      if (r.e === 'paywall_open') o.pay += r.n;
      if (r.e === 'checkout_start') o.co += r.n;
      if (r.e === 'purchase') o.buy += r.n;
      if (r.e === 'code_redeem') o.code += r.n;
    });
    var t = $('funnel'); t.innerHTML = '';
    var head = t.appendChild(el('tr'));
    ['Sitio', 'Aperturas', 'Vieron el pase', 'Iniciaron pago', 'Compraron', 'Con código', 'Compra / pase visto'].forEach(function (h) { head.appendChild(el('th', h)); });
    Object.keys(by).sort(function (a, b) { return by[b].open - by[a].open; }).forEach(function (s) {
      var o = by[s], tr = t.appendChild(el('tr'));
      [s, fmt(o.open), fmt(o.pay), fmt(o.co), fmt(o.buy), fmt(o.code), pct(o.buy, o.pay)].forEach(function (c) { tr.appendChild(el('td', c)); });
    });

    // Piezas más escuchadas
    var pcs = {};
    rs.forEach(function (r) { if (r.p && (r.e === 'audio_play' || r.e === 'audio_end' || r.e === 'piece_view' || r.e === 'audio_stop' || r.e === 'util_si' || r.e === 'util_no')) { var o = pcs[r.p] || (pcs[r.p] = { play: 0, end: 0, view: 0, stop: 0, stopFar: 0, si: 0, no: 0 }); if (r.e === 'util_si') o.si += r.n; else if (r.e === 'util_no') o.no += r.n; else if (r.e === 'audio_play') o.play += r.n; else if (r.e === 'audio_end') o.end += r.n; else if (r.e === 'audio_stop') { o.stop += r.n; if (r.k === '75' || r.k === '100') o.stopFar += r.n; } else o.view += r.n; } });
    var list = Object.keys(pcs).sort(function (a, b) { return pcs[b].play - pcs[a].play || pcs[b].view - pcs[a].view; }).slice(0, 12);
    var pbox = $('pieces'); pbox.innerHTML = '';
    var pm = list.length ? Math.max(pcs[list[0]].play, 1) : 1;
    list.forEach(function (p) {
      var r = el('div', undefined, 'hbar');
      r.appendChild(el('span', p));
      var tr = el('div', undefined, 'track'), f = el('div', undefined, 'fill'); f.style.width = (pcs[p].play / pm) * 100 + '%'; tr.appendChild(f); r.appendChild(tr);
      r.appendChild(el('span', pcs[p].play + ' · ' + pcs[p].view + ' vistas' + (pcs[p].stop ? ' · ' + pct(pcs[p].stopFar, pcs[p].stop) + ' llegan al 75 %' : '') + (pcs[p].si || pcs[p].no ? ' · 👍 ' + pcs[p].si + ' · 👎 ' + pcs[p].no : ''), 'n'));
      r.lastChild.title = 'Audios iniciados · veces que se abrió la ficha · de quienes dejaron el audio, cuántos pasaron del 75 %. Terminados: ' + pcs[p].end;
      pbox.appendChild(r);
    });
    if (!list.length) pbox.textContent = 'Todavía no hay datos.';

    // Idiomas
    var ls = {}, lt = 0;
    rs.forEach(function (r) { if (r.e === 'app_open' && r.l) { ls[r.l] = (ls[r.l] || 0) + r.n; lt += r.n; } });
    var lbox = $('langs'); lbox.innerHTML = '';
    var names = { es: 'Español', en: 'English', fr: 'Français', pl: 'Polski', ru: 'Русский', ja: '日本語' };
    Object.keys(ls).sort(function (a, b) { return ls[b] - ls[a]; }).forEach(function (l) {
      var r = el('div', undefined, 'hbar');
      r.appendChild(el('span', names[l] || l));
      var tr = el('div', undefined, 'track'), f = el('div', undefined, 'fill'); f.style.width = (ls[l] / lt) * 100 + '%'; tr.appendChild(f); r.appendChild(tr);
      r.appendChild(el('span', pct(ls[l], lt), 'n'));
      lbox.appendChild(r);
    });
    if (!lt) lbox.textContent = 'Todavía no hay datos.';

    // Barras simples: cuenta por la clave k de un evento (país, origen o pantalla)
    function tally(box, event, labelOf, emptyText) {
      var m = {}, total = 0;
      rs.forEach(function (r) { if (r.e === event && r.k) { m[r.k] = (m[r.k] || 0) + r.n; total += r.n; } });
      box.innerHTML = '';
      Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).slice(0, 15).forEach(function (k) {
        var row = el('div', undefined, 'hbar');
        row.appendChild(el('span', labelOf(k)));
        var track = el('div', undefined, 'track'), fill = el('div', undefined, 'fill'); fill.style.width = (m[k] / total) * 100 + '%'; track.appendChild(fill); row.appendChild(track);
        row.appendChild(el('span', fmt(m[k]) + ' · ' + pct(m[k], total), 'n'));
        box.appendChild(row);
      });
      if (!total) box.textContent = emptyText;
    }
    var regionNames = null;
    try { regionNames = new Intl.DisplayNames(['es'], { type: 'region' }); } catch (e) {}
    tally($('countries'), 'visit_country', function (c) {
      if (c === 'XX' || c === 'T1') return 'No se sabe';
      try { return (regionNames && regionNames.of(c)) || c; } catch (e) { return c; }
    }, 'Todavía no hay datos de país (empiezan a contarse desde la última actualización).');
    var srcNames = { app_instalada: 'Abren la app instalada', qr: 'Un QR o enlace con código', buscador: 'Un buscador (Google, Bing…)', redes: 'Redes sociales', otro_sitio: 'Otra página web', directo: 'Escribieron la dirección o la tenían guardada' };
    tally($('sources'), 'app_open', function (k) { return srcNames[k] || k; }, 'Todavía no hay datos de origen.');
    var scrNames = { inicio: 'Inicio', salas: 'Salas o zonas', recorridos: 'Recorridos', mapa: 'Mapa', buscar: 'Buscar', sala: 'Dentro de una sala', ficha: 'Ficha de una obra o parada', asistente: 'Asistente de recorrido', fin_recorrido: 'Final de un recorrido' };
    tally($('screens'), 'screen_view', function (k) { return scrNames[k] || k; }, 'Todavía no hay datos de pantallas.');

    // Recorridos (resumen anónimo de cada visita)
    renderVisits();
    renderMessages();
  }


  // ───────────── Gráficas (SVG sin librerías) ─────────────
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, text) { var e = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (text !== undefined) e.textContent = text; return e; }
  function niceMax(v) { if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function mondayOf(iso) { var d = new Date(iso + 'T00:00:00Z'), w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w); return isoDay(d); }
  function bucketOf(iso, gran) { return gran === 'week' ? mondayOf(iso) : gran === 'month' ? iso.slice(0, 7) : iso; }
  function labelOf(b, gran) {
    if (gran === 'month') { var m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']; return m[Number(b.slice(5, 7)) - 1] + ' ' + b.slice(2, 4); }
    var d = b.slice(8, 10), mm = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(b.slice(5, 7)) - 1];
    return (gran === 'week' ? 'sem. ' : '') + Number(d) + ' ' + mm;
  }

  /** Cubetas (día, semana o mes) del periodo actual, sin huecos, con la suma de cada serie. */
  function buckets(rs, gran, defs) {
    var start = periodStart(), end = isoDay(new Date()), order = [], seen = {};
    for (var d = start; d <= end; d = shiftDay(d, 1)) { var b = bucketOf(d, gran); if (!seen[b]) { seen[b] = {}; order.push(b); defs.forEach(function (x) { seen[b][x.id] = 0; }); } }
    rs.forEach(function (r) { var b = bucketOf(r.day, gran); defs.forEach(function (x) { if (seen[b] && x.match(r)) seen[b][x.id] += r.n; }); });
    return { keys: order, vals: seen };
  }

  /** Dibuja líneas o barras. series: [{name, cls, values}], labels: texto del eje X. */
  function drawChart(box, labels, series, opts) {
    box.innerHTML = '';
    opts = opts || {};
    var any = series.some(function (s) { return s.values.some(function (v) { return v > 0; }); });
    if (!labels.length || !any) { box.appendChild(el('p', 'Todavía no hay datos en este periodo.', 'sub')); return; }
    var W = 640, H = 230, L = 44, R = 12, T = 12, B = 28, iw = W - L - R, ih = H - T - B, n = labels.length;
    var max = niceMax(Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.values); })));
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': opts.title || 'Gráfica' });
    var xAt = function (i) { return L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); };
    var yAt = function (v) { return T + ih - (v / max) * ih; };
    for (var t = 0; t <= 4; t++) {
      var v = (max / 4) * t, y = yAt(v);
      svg.appendChild(sv('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid' }));
      svg.appendChild(sv('text', { x: L - 6, y: y + 4, class: 'tick', 'text-anchor': 'end' }, fmt(Math.round(v * 10) / 10)));
    }
    var every = Math.max(1, Math.ceil(n / 7));
    labels.forEach(function (lb, i) { if (i % every === 0 || i === n - 1) { if (i === n - 1 && (n - 1) % every !== 0 && n > 1 && (n - 1 - Math.floor((n - 1) / every) * every) < every / 2) return; svg.appendChild(sv('text', { x: xAt(i), y: H - 8, class: 'tick', 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, lb)); } });
    series.forEach(function (s) {
      if (opts.bars) {
        var bw = Math.max(2, (iw / n) * 0.7);
        s.values.forEach(function (v, i) { if (v > 0) svg.appendChild(sv('rect', { x: xAt(i) - bw / 2, y: yAt(v), width: bw, height: T + ih - yAt(v), class: 'bar ' + s.cls })); });
      } else {
        var pts = s.values.map(function (v, i) { return xAt(i) + ',' + yAt(v); });
        if (s.area) svg.appendChild(sv('polygon', { points: xAt(0) + ',' + (T + ih) + ' ' + pts.join(' ') + ' ' + xAt(n - 1) + ',' + (T + ih), class: 'area ' + s.cls }));
        svg.appendChild(sv('polyline', { points: pts.join(' '), class: 'line ' + s.cls }));
        if (n <= 40) s.values.forEach(function (v, i) { svg.appendChild(sv('circle', { cx: xAt(i), cy: yAt(v), r: 2.5, class: 'dot ' + s.cls })); });
      }
    });
    // Zonas sensibles: al pasar el cursor (o tocar) sale el detalle de ese día, semana o mes
    labels.forEach(function (lb, i) {
      var w = iw / n, zone = sv('rect', { x: xAt(i) - w / 2, y: T, width: w, height: ih, class: 'hit' });
      zone.appendChild(sv('title', {}, lb + '\n' + series.map(function (s) { return s.name + ': ' + fmt(s.values[i]); }).join('\n')));
      svg.appendChild(zone);
    });
    box.appendChild(svg);
    var lg = el('div', undefined, 'legend');
    series.forEach(function (s) { var sp = el('span'); var i = el('i'); i.className = 'sw ' + s.cls; sp.appendChild(i); sp.appendChild(document.createTextNode(s.name)); lg.appendChild(sp); });
    box.appendChild(lg);
  }

  function renderCharts(rs) {
    var gran = $('gran').value;
    var defs = [
      { id: 'open', match: function (r) { return r.e === 'app_open'; } },
      { id: 'new', match: function (r) { return r.e === 'visitor_new'; } },
      { id: 'buy', match: function (r) { return r.e === 'purchase' || r.e === 'code_redeem'; } },
      { id: 'pay', match: function (r) { return r.e === 'paywall_open'; } },
      { id: 'audio', match: function (r) { return r.e === 'audio_play'; } }
    ];
    var b = buckets(rs, gran, defs), labels = b.keys.map(function (k) { return labelOf(k, gran); });
    var col = function (id) { return b.keys.map(function (k) { return b.vals[k][id]; }); };
    var open = col('open'), nuevos = col('new');
    drawChart($('chVisitas'), labels, [
      { name: 'Aperturas de la app', cls: 's1', values: open, area: true },
      { name: 'Visitantes nuevos', cls: 's2', values: nuevos }
    ], { title: 'Aperturas y visitantes nuevos' });
    var acc = 0, acumulado = nuevos.map(function (v) { acc += v; return acc; });
    drawChart($('chNuevos'), labels, [{ name: 'Visitantes nuevos acumulados en este periodo', cls: 's2', values: acumulado, area: true }], { title: 'Visitantes nuevos acumulados' });
    drawChart($('chEmbudo'), labels, [
      { name: 'Vieron el pase', cls: 's3', values: col('pay') },
      { name: 'Compras y códigos', cls: 's4', values: col('buy') }
    ], { title: 'Pase visto y compras', bars: false });
    drawChart($('chAudios'), labels, [{ name: 'Audios iniciados', cls: 's1', values: col('audio') }], { title: 'Audios iniciados', bars: true });
    $('exactNote').textContent = exact ? 'Los conteos de esta versión son exactos (se cuentan uno por uno en el servidor).' : 'Los conteos de esta versión son aproximados: en un pico de visitas, dos eventos exactamente simultáneos pueden contarse como uno.';
  }

  function renderMessages() {
    var box = $('msgs'); box.innerHTML = '';
    if (!messages || !messages.length) { box.appendChild(el('p', messages ? 'Todavía no hay mensajes.' : 'Sin datos: el servidor aún no tiene el formulario.', 'sub')); return; }
    messages.forEach(function (m) {
      var c = el('div', undefined, 'msg');
      var head = (m.t === 'error' ? 'Error' : 'Mensaje') + ' · ' + new Date(m.at).toLocaleString('es-MX') + (m.s ? ' · ' + m.s : '') + (m.p ? ' · ' + m.p : '') + (m.l ? ' · ' + m.l : '');
      c.appendChild(el('strong', head));
      c.appendChild(el('p', m.m));
      if (m.c) c.appendChild(el('p', 'Responder a: ' + m.c, 'sub'));
      c.style.cssText = 'border-bottom:1px solid var(--line);padding:10px 0;white-space:pre-wrap';
      box.appendChild(c);
    });
  }
  function renderVisits() {
    var v = visits, total = v ? (v.visitas || 0) : 0;
    var scr = { inicio: 'Inicio', salas: 'Salas', recorridos: 'Recorridos', mapa: 'Mapa', buscar: 'Buscar', sala: 'Sala', ficha: 'Ficha', asistente: 'Asistente', fin_recorrido: 'Fin del recorrido', pase: 'Pantalla del pase' };
    function group(prefix) {
      var out = {};
      Object.keys(v || {}).forEach(function (k) { if (k.indexOf(prefix + '|') === 0) out[k.slice(prefix.length + 1)] = v[k]; });
      return out;
    }
    function bars(box, m, labelOf, order, limit) {
      box.innerHTML = '';
      var keys = order || Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
      keys = keys.filter(function (k) { return m[k]; }).slice(0, limit || 99);
      keys.forEach(function (k) {
        var row = el('div', undefined, 'hbar');
        row.appendChild(el('span', labelOf(k)));
        var track = el('div', undefined, 'track'), fill = el('div', undefined, 'fill'); fill.style.width = (m[k] / total) * 100 + '%'; track.appendChild(fill); row.appendChild(track);
        row.appendChild(el('span', fmt(m[k]) + ' · ' + pct(m[k], total), 'n'));
        box.appendChild(row);
      });
      if (!keys.length) box.textContent = 'Todavía no hay datos de visitas (empiezan a contarse con la actualización).';
    }
    var auds = group('audios'), mins = group('minutos');
    var tiles = $('vtiles'); tiles.innerHTML = '';
    [['Visitas resumidas', fmt(total)],
     ['Escucharon al menos 1 audio', total ? pct(total - (auds['0'] || 0), total) : '–'],
     ['Llegaron a la pantalla del pase', total ? pct(v.vio_pase || 0, total) : '–'],
     ['Se quedan menos de 1 minuto', total ? pct(mins['1'] || 0, total) : '–']].forEach(function (t) {
      var d = el('div', undefined, 'card tile'); d.appendChild(el('b', t[1])); d.appendChild(el('span', t[0])); tiles.appendChild(d);
    });
    var routes = group('ruta');
    bars($('vroutes'), routes, function (k) { return k.split('>').map(function (x) { return scr[x] || x; }).join(' → '); }, null, 10);
    bars($('vexit'), group('salida'), function (k) { return scr[k] || k; }, null, 10);
    bars($('vaudios'), auds, function (k) { return k === '0' ? 'Ninguno' : k.indexOf('+') > -1 ? 'Más de ' + k.replace('+', '') : k === '1' ? '1 audio' : 'Hasta ' + k; }, ['0', '1', '2', '3', '5', '10', '10+']);
    var heard = group('escucha'), hs = 0; Object.keys(heard).forEach(function (k) { hs += heard[k]; });
    var hbox = $('vheard'); hbox.innerHTML = '';
    ['25', '50', '75', '100'].forEach(function (k) {
      if (!heard[k]) return;
      var row = el('div', undefined, 'hbar'); row.appendChild(el('span', k === '100' ? 'Casi todo (más del 75 %)' : k === '75' ? 'Entre 50 y 75 %' : k === '50' ? 'Entre 25 y 50 %' : 'Menos de 25 %'));
      var track = el('div', undefined, 'track'), fill = el('div', undefined, 'fill'); fill.style.width = (heard[k] / hs) * 100 + '%'; track.appendChild(fill); row.appendChild(track);
      row.appendChild(el('span', fmt(heard[k]) + ' · ' + pct(heard[k], hs), 'n')); hbox.appendChild(row);
    });
    if (!hs) hbox.textContent = 'Todavía no hay datos de audios.';
    bars($('vmins'), mins, function (k) { return k === '1' ? 'Hasta 1' : k.indexOf('+') > -1 ? 'Más de ' + k.replace('+', '') : 'Hasta ' + k; }, ['1', '3', '5', '10', '20', '40', '40+']);
    bars($('vsites'), group('sitio'), function (k) { return k; }, null, 10);
  }

  $('loginForm').addEventListener('submit', function (e) { e.preventDefault(); load(); });
  $('days').addEventListener('change', load);
  $('site').addEventListener('change', render);
  $('gran').addEventListener('change', render);
  $('logout').addEventListener('click', function () { store.del('panel_key'); $('key').value = ''; $('view').hidden = true; $('login').hidden = false; });
  if ($('api').value && $('key').value) load();
})();

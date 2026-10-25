// Sitios "genéricos" de la hoja CONTROL (todos menos MNA y Teotihuacán, que tienen lógica propia):
// recorridos sugeridos, manifiesto del sitio y entrada de public/data/sites.json. Solo funciones puras, fáciles de probar.

/** "express|completa" → ['express','completa'] (minúsculas, sin vacíos). */
export const partirRutas = (valor) => String(valor || '').split('|').map((x) => x.trim().toLowerCase()).filter(Boolean);

/**
 * Definiciones de recorridos desde la pestaña RUTAS del Sheet del sitio.
 * Columnas: ruta (clave), nombre, duracion, minutos, descripcion (opcionales: nombre_en, descripcion_en, …_fr, …_pl).
 */
export function leerDefinicionesRutas(filas) {
  if (!Array.isArray(filas) || filas.length < 2) return [];
  const cab = filas[0].map((x) => String(x).trim());
  const defs = [];
  for (const fila of filas.slice(1)) {
    const o = Object.fromEntries(cab.map((k, i) => [k, String(fila[i] ?? '').trim()]));
    const key = o.ruta.toLowerCase();
    if (!key || !o.nombre) continue;
    const minutos = Number(String(o.minutos).replace(',', '.')) || 0;
    const def = { key, id: `ruta-${key.replace(/[^a-z0-9]+/g, '-')}`, name: o.nombre, duration: o.duracion, estimated_minutes: minutos, description: o.descripcion };
    // grupo = cómo se agrupa en la app: tiempo | tema | completo (vacío = sin agrupar)
    if (['tiempo', 'tema', 'completo'].includes(String(o.grupo || '').toLowerCase())) def.group = String(o.grupo).toLowerCase();
    for (const l of ['en', 'fr', 'pl']) {
      if (o[`nombre_${l}`]) def[`name_${l}`] = o[`nombre_${l}`];
      if (o[`descripcion_${l}`]) def[`description_${l}`] = o[`descripcion_${l}`];
    }
    defs.push(def);
  }
  return defs;
}

/** Arma los recorridos: cada pieza dice en la columna `rutas` a cuáles pertenece. Orden: zona, orden_sugerido y fila. */
export function construirRutasSitio(siteId, piezas, salas, defs, rutasPorId, avisar = () => {}) {
  const rutasDe = (p) => (rutasPorId instanceof Map ? rutasPorId.get(p.piece_id) : partirRutas(p.rutas)) || [];
  const conocidas = new Set(defs.map((d) => d.key));
  const numSala = new Map(salas.map((r) => [r.room_id, parseInt(r.numero_oficial, 10) || 0]));
  const nomSala = new Map(salas.map((r) => [r.room_id, r.nombre_oficial]));
  for (const p of piezas) {
    for (const k of rutasDe(p)) {
      if (!conocidas.has(k)) avisar(`${siteId}: la columna rutas usa un valor que no está en la pestaña RUTAS`, `${p.piece_id} → "${k}"`);
    }
  }
  return defs.map(({ key, ...ruta }) => {
    const stops = piezas
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => rutasDe(p).includes(key))
      .sort((a, b) => (numSala.get(a.p.room_id) || 0) - (numSala.get(b.p.room_id) || 0) || (a.p.orden_sugerido || 99) - (b.p.orden_sugerido || 99) || a.i - b.i)
      .map(({ p }) => ({
        id: p.piece_id,
        piece_id: p.piece_id,
        poi_id: p.piece_id,
        title: p.titulo,
        is_premium: !p.is_free,
        estimated_minutes: 5,
        thumbnail: p.image_filename,
        file: `data/${siteId}/pieces.json`,
        ranking: p.is_free ? 1 : 2,
        room_zone: nomSala.get(p.room_id) || '',
        room_id: p.room_id,
        ...(p.piso ? { piso: p.piso } : {}),
        map_coords: { x: p.map_x, y: p.map_y },
        tags: [siteId],
      }));
    return { ...ruta, stops };
  });
}

/**
 * «Antes de ir» desde la pestaña ANTES_DE_IR del Sheet del sitio: cómo llegar, horarios, qué llevar…
 * Columnas: orden, tema, titulo, texto, enlace, enlace_texto, publicar (y titulo_en, texto_en, enlace_texto_en, … _fr, _pl).
 * Solo salen las filas con título y texto, y con publicar distinto de NO. Se ordenan por la columna orden.
 */
export function leerAntesDeIr(filas) {
  if (!Array.isArray(filas) || filas.length < 2) return [];
  const cab = filas[0].map((x) => String(x).trim().toLowerCase());
  const items = [];
  filas.slice(1).forEach((fila, i) => {
    const o = Object.fromEntries(cab.map((k, j) => [k, String(fila[j] ?? '').trim()]));
    if (!o.titulo || !o.texto || String(o.publicar || '').toUpperCase() === 'NO') return;
    const item = { topic: (o.tema || 'consejo').toLowerCase(), title: o.titulo, text: o.texto };
    if (/^https?:\/\//i.test(o.enlace || '')) {
      item.link = o.enlace;
      if (o.enlace_texto) item.link_label = o.enlace_texto;
    }
    for (const l of ['en', 'fr', 'pl']) {
      if (o[`titulo_${l}`]) item[`title_${l}`] = o[`titulo_${l}`];
      if (o[`texto_${l}`]) item[`text_${l}`] = o[`texto_${l}`];
      if (o[`enlace_texto_${l}`]) item[`link_label_${l}`] = o[`enlace_texto_${l}`];
    }
    const orden = Number(String(o.orden).replace(',', '.'));
    items.push({ item, orden: Number.isFinite(orden) && o.orden !== '' ? orden : 1000 + i, fila: i });
  });
  return items.sort((a, b) => a.orden - b.orden || a.fila - b.fila).map((x) => x.item);
}

/** Manifiesto data/<sitio>/<sitio>.json que la app abre al entrar al sitio. */
export function manifiestoSitio(sitio, rutas, mapaEnVivo, antesDeIr = []) {
  const precio = Number(String(sitio.precio_mxn || '').replace(',', '.'));
  return {
    site_id: sitio.site_id.toUpperCase(),
    name: sitio.nombre,
    ...(precio > 0 ? { pass_price_mxn: precio } : {}),
    layout: 'zones',
    rooms_path: `data/${sitio.site_id}/rooms.json`,
    pieces_path: `data/${sitio.site_id}/pieces.json`,
    routes: rutas,
    ...(mapaEnVivo ? { live_map: mapaEnVivo } : {}),
    ...(antesDeIr.length ? { before_visit: antesDeIr } : {}),
  };
}

/**
 * Entrada de sites.json. Si ya existía una (con sus traducciones escritas a mano) se conservan sus campos y solo se
 * actualizan los que vienen de CONTROL y del Sheet. `preview` = el sitio aún no está publicado (solo se ve con ?preview).
 */
export function entradaSitio(sitio, salas, piezas, previa = {}, { preview = false } = {}) {
  // Foto de portada: la pieza que se pone en la columna `portada` de CONTROL; si no, la primera con foto
  const conFoto = piezas.find((p) => p.image_filename && p.piece_id === String(sitio.portada || '').trim()) || piezas.find((p) => p.image_filename);
  const precio = Number(String(sitio.precio_mxn || '').replace(',', '.'));
  const out = {
    ...previa,
    id: sitio.site_id.toUpperCase(),
    name: sitio.nombre,
    short_name: previa.short_name || sitio.nombre,
    location: sitio.ubicacion || previa.location || '',
    thumbnail: previa.thumbnail || '',
    badge: sitio.insignia || previa.badge || '',
    status: preview ? 'preview' : 'active',
    path: `data/${sitio.site_id}/${sitio.site_id}.json`,
    description: sitio.descripcion || previa.description || '',
    // Presentación larga del sitio (columna `introduccion` de CONTROL; párrafos separados por una línea en blanco)
    intro: sitio.introduccion || previa.intro || '',
    ...Object.fromEntries(['en', 'fr', 'pl'].map((l) => [`intro_${l}`, sitio[`introduccion_${l}`] || previa[`intro_${l}`] || '']).filter(([, v]) => v)),
    highlights_count: piezas.length,
    total_stops: salas.length,
  };
  if (precio > 0) out.pass_price_mxn = precio;
  if (conFoto) { out.cover_image = conFoto.image_filename; out.cover_piece_id = conFoto.piece_id; }
  return out;
}

/** Mezcla las entradas generadas con sites.json: las del mismo id se reemplazan; las nuevas se agregan al final. */
export function mezclarSites(actual, nuevas) {
  const lista = Array.isArray(actual) ? [...actual] : [];
  for (const n of nuevas) {
    const i = lista.findIndex((s) => String(s.id).toUpperCase() === n.id);
    if (i >= 0) lista[i] = n; else lista.push(n);
  }
  return lista;
}

/**
 * Pone nombre, duración y descripciones (es/en/fr/pl) de la pestaña RUTAS sobre recorridos que ya existen en el código
 * (MNA y Teotihuacán). Se enlaza por la columna `ruta` = id del recorrido ("ruta-monumental") o su clave ("express").
 * Solo pisa lo que la celda trae lleno; las paradas no cambian. Devuelve los recorridos y las claves que no encontró.
 */
export function aplicarDefiniciones(rutas, defs, claveDe = () => '') {
  const usadas = new Set();
  const salida = rutas.map((r) => {
    const d = defs.find((x) => x.key === r.id || x.id === r.id || (claveDe(r) && x.key === claveDe(r)));
    if (!d) return r;
    usadas.add(d.key);
    const nueva = { ...r };
    if (d.group) nueva.group = d.group;
    for (const campo of ['name', 'duration', 'description', 'name_en', 'name_fr', 'name_pl', 'description_en', 'description_fr', 'description_pl']) {
      if (d[campo]) nueva[campo] = d[campo];
    }
    if (d.estimated_minutes > 0) nueva.estimated_minutes = d.estimated_minutes;
    return nueva;
  });
  return { rutas: salida, sinUsar: defs.filter((d) => !usadas.has(d.key)).map((d) => d.key) };
}

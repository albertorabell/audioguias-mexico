import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol, PMTiles, type Source, type RangeResponse } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { Building2, LocateFixed, Navigation, X } from 'lucide-react';
import { LiveMapConfig } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { circlePolygon, distanceMeters, roundMeters } from '../utils/geo';
import { walkingMapsUrl } from '../utils/maps';
import { BUILDING_UI, insideOutline, planLang } from '../config/buildings';

export interface LiveStop {
  id: string;
  title: string;
  lat: number;
  lng: number;
  /** Número en el recorrido en curso (1, 2…); vacío si la parada no es del recorrido. */
  tourNum?: number;
  /** true = parada ya recorrida. */
  done?: boolean;
}

interface LiveMapProps {
  config: LiveMapConfig;
  stops: LiveStop[];
  /** Paradas del recorrido en curso, en orden (para dibujar la línea y decir cuál sigue). */
  routeIds: string[];
  /** Id de la parada donde va el recorrido. */
  currentId?: string;
  onOpenStop: (id: string) => void;
  /** Edificios con plano interior: se dibujan con su contorno y un botón para entrar al plano. */
  buildings?: LiveBuilding[];
  /** Parada que está dentro de un edificio → id del edificio (para la línea del recorrido y la siguiente parada). */
  insideOf?: Record<string, string>;
  onEnterBuilding?: (id: string) => void;
}

export interface LiveBuilding {
  id: string;
  name: string;
  /** [lng, lat] */
  outline: [number, number][];
  center: [number, number];
  /** Cuántas paradas tiene adentro. */
  count: number;
  /** Números del recorrido en curso que están adentro. */
  tourNums: number[];
  /** Paradas de adentro, en orden (se listan en la tarjeta del edificio). */
  stops: { id: string; title: string; num?: number }[];
  /** true = el edificio tiene plano interior y se puede «entrar». */
  hasPlan: boolean;
}

/** El archivo .pmtiles es pequeño (1 a 3 MB): se baja completo una vez y se lee de memoria, así funciona sin internet. */
class MemorySource implements Source {
  constructor(private key: string, private data: Promise<ArrayBuffer>) {}
  getKey() {
    return this.key;
  }
  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const buf = await this.data;
    return { data: buf.slice(offset, offset + length) };
  }
}

let protocol: Protocol | null = null;
const registered = new Set<string>();
function registerSource(url: string): string {
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
  }
  if (!registered.has(url)) {
    const data = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar el mapa (${r.status})`);
      return r.arrayBuffer();
    });
    protocol.add(new PMTiles(new MemorySource(url, data)));
    registered.add(url);
  }
  return url;
}

/** Nombre corto para el mapa: lo que va antes de los dos puntos o de la primera coma. */
const shortTitle = (t: string) => t.split(/[:,]/)[0].trim();

type GpsState = 'idle' | 'locating' | 'ok' | 'denied' | 'far';

export const LiveMap: React.FC<LiveMapProps> = ({ config, stops, routeIds, currentId, onOpenStop, buildings = [], insideOf = {}, onEnterBuilding }) => {
  const { strings, currentLanguage } = useLanguage();
  const m = strings.ui.map;
  const bt = BUILDING_UI[planLang(currentLanguage)];
  const [selB, setSelB] = useState<string | null>(null);
  const bById = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const watchRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [gps, setGps] = useState<GpsState>('idle');
  const [me, setMe] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const fitted = useRef(false);
  const stopById = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);

  // --- Crear el mapa una sola vez ---
  useEffect(() => {
    if (!box.current) return;
    const url = registerSource(new URL(config.pmtiles.replace(/^\.?\/*/, '/'), window.location.origin).href);
    // Mapa claro siempre: se lee mejor con el sol de afuera. Sin letreros salvo los nombres de calles (si el sitio los pide): las letras viajan dentro de la app y todo funciona sin internet.
    const todas = layers('protomaps', namedFlavor('light'), { lang: 'es' }) as any[];
    const baseLayers = todas.filter((l) => l.type !== 'symbol' || (config.labels && String(l.id).includes('roads_labels')));
    const map = new maplibregl.Map({
      container: box.current,
      style: {
        version: 8,
        ...(config.labels ? { glyphs: `${new URL('/fonts/', window.location.origin).href}{fontstack}/{range}.pbf` } : {}),
        sources: { protomaps: { type: 'vector', url: `pmtiles://${url}`, attribution: m.attribution } },
        layers: baseLayers,
      } as any,
      center: config.center,
      zoom: config.zoom,
      maxZoom: (config.maxZoom ?? 17) + 1.5,
      minZoom: 12,
      maxBounds: [
        [config.bounds[0] - 0.02, config.bounds[1] - 0.02],
        [config.bounds[2] + 0.02, config.bounds[3] + 0.02],
      ],
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }), 'top-right');
    map.on('load', () => {
      map.addSource('bldg', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'bldg-fill', type: 'fill', source: 'bldg', paint: { 'fill-color': '#04a4b1', 'fill-opacity': 0.16 } });
      map.addLayer({ id: 'bldg-line', type: 'line', source: 'bldg', paint: { 'line-color': '#04a4b1', 'line-width': 2.5 } });
      map.on('click', 'bldg-fill', (e) => { const id = e.features?.[0]?.properties?.id; if (id) { setSelected(null); setSelB(String(id)); } });
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#04a4b1', 'line-width': 4, 'line-dasharray': [1.5, 1.5] } });
      map.addSource('me-acc', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'me-acc-fill', type: 'fill', source: 'me-acc', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 } });
      map.addSource('me', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'me-dot', type: 'circle', source: 'me', paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
      const upd = () => box.current?.classList.toggle('live-zoomed', map.getZoom() >= 16);
      map.on('zoom', upd);
      map.on('moveend', upd);
      upd();
      setReady(true);
    });
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      markersRef.current.forEach((mk) => mk.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.pmtiles]);

  // --- Paradas (marcadores numerados) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current.clear();
    for (const s of stops) {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', s.title);
      const inTour = s.tourNum !== undefined;
      const isCurrent = s.id === currentId;
      el.className = [
        'rounded-full flex items-center justify-center font-bold border-2 cursor-pointer shadow',
        inTour ? 'w-8 h-8 text-[13px]' : 'w-4 h-4',
        inTour ? (s.done ? 'bg-raised text-ink-3 border-line' : 'bg-jade text-on-jade border-white') : 'bg-white border-jade',
        isCurrent ? 'ring-4 ring-jade/40' : '',
      ].join(' ');
      el.textContent = inTour ? String(s.tourNum) : '';
      const label = document.createElement('span');
      label.className = 'live-label';
      label.textContent = shortTitle(s.title);
      if (!config.labels_route_only || inTour) el.appendChild(label);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setSelB(null);
        setSelected(s.id);
      });
      markersRef.current.set(s.id, new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map));
    }
    // Edificios: contorno y etiqueta con botón para entrar
    (map.getSource('bldg') as maplibregl.GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: buildings.filter((b) => b.outline.length >= 3).map((b) => ({ type: 'Feature', properties: { id: b.id }, geometry: { type: 'Polygon', coordinates: [[...b.outline, b.outline[0]]] } })),
    });
    for (const b of buildings) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'live-building';
      el.setAttribute('aria-label', `${b.name}. ${bt.inside(b.count)}. ${bt.enter}`);
      const nums = b.tourNums.length ? (b.tourNums.length > 1 ? `${b.tourNums[0]}–${b.tourNums[b.tourNums.length - 1]}` : String(b.tourNums[0])) : '';
      el.innerHTML = '';
      const t = document.createElement('span');
      t.className = 'live-building-name';
      t.textContent = b.name;
      const c = document.createElement('span');
      c.className = 'live-building-count';
      c.textContent = nums || String(b.count);
      el.append(c, t);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setSelected(null);
        setSelB(b.id);
      });
      markersRef.current.set(`b:${b.id}`, new maplibregl.Marker({ element: el }).setLngLat(b.center).addTo(map));
    }
    if (!fitted.current && stops.length + buildings.length > 0) {
      fitted.current = true;
      const bb = new maplibregl.LngLatBounds();
      stops.forEach((s) => bb.extend([s.lng, s.lat]));
      buildings.forEach((b) => (b.outline.length ? b.outline : [b.center]).forEach((p) => bb.extend(p)));
      if (stops.length + buildings.length > 1 || buildings.length) map.fitBounds(bb, { padding: 50, maxZoom: 17, duration: 0 });
    }
    // Línea del recorrido: las paradas de adentro de un edificio se cuentan en el edificio
    const line: number[][] = [];
    for (const id of routeIds) {
      const s = stopById.get(id);
      const b = insideOf[id] ? bById.get(insideOf[id]) : undefined;
      const p = s ? [s.lng, s.lat] : b ? b.center : null;
      if (!p) continue;
      const last = line[line.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) line.push(p);
    }
    (map.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: line.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }] : [],
    });
  }, [stops, routeIds, currentId, ready, stopById, buildings, insideOf, bById, bt]);

  // --- Posición de la persona ---
  const stopWatching = useCallback(() => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGps('denied');
      return;
    }
    stopWatching();
    setGps('locating');
    let first = true;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) };
        setMe(p);
        const far = distanceMeters(p, { lat: config.center[1], lng: config.center[0] }) > (config.near_meters ?? 4000);
        setGps(far ? 'far' : 'ok');
        const map = mapRef.current;
        if (!map || far) return;
        (map.getSource('me') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } });
        (map.getSource('me-acc') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [circlePolygon(p.lat, p.lng, p.acc)] } });
        if (first) {
          first = false;
          map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16) });
        }
      },
      () => {
        stopWatching();
        setGps('denied');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }, [config, stopWatching]);

  // --- Textos: parada más cercana y distancia a la siguiente ---
  const here = gps === 'ok' && me ? me : null;
  const nearest = useMemo(() => {
    if (!here || !stops.length) return null;
    let best: { s: LiveStop; d: number } | null = null;
    for (const s of stops) {
      const d = distanceMeters(here, s);
      if (!best || d < best.d) best = { s, d };
    }
    return best;
  }, [here, stops]);
  const next = useMemo(() => {
    if (!here || !currentId) return null;
    const i = routeIds.indexOf(currentId);
    const nid = i >= 0 ? routeIds[i + 1] : undefined;
    const s = nid ? stopById.get(nid) : undefined;
    if (s) return { s, d: distanceMeters(here, s) };
    const b = nid && insideOf[nid] ? bById.get(insideOf[nid]) : undefined;
    return b ? { s: { id: nid!, title: b.name, lat: b.center[1], lng: b.center[0] } as LiveStop, d: distanceMeters(here, { lat: b.center[1], lng: b.center[0] }), inB: b, num: i + 2 } : null;
  }, [here, currentId, routeIds, stopById, insideOf, bById]);
  // La persona está dentro de un edificio con plano
  const inBuilding = useMemo(() => (here ? buildings.find((b) => b.outline.length >= 3 && insideOutline(here.lng, here.lat, b.outline)) : undefined), [here, buildings]);
  const sb = selB ? bById.get(selB) : undefined;

  const sel = selected ? stopById.get(selected) : null;
  const mapsUrl = sel ? walkingMapsUrl(sel) : '';

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-line bg-surface">
        <div ref={box} id="live-map" className="w-full h-[62vh] min-h-[360px]" />
        <button
          type="button"
          id="btn-locate"
          onClick={locate}
          className="absolute left-3 top-3 h-11 px-4 rounded-full bg-jade text-on-jade text-ui font-bold inline-flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-transform"
        >
          <LocateFixed className="w-5 h-5" />
          {gps === 'locating' ? m.locating : m.locate}
        </button>
      </div>

      <div className="mt-3 space-y-1.5 px-1 text-ui" aria-live="polite">
        {gps === 'denied' && <p className="text-ink-2">{m.locationDenied}</p>}
        {gps === 'far' && <p className="text-ink-2">{m.farAway}</p>}
        {inBuilding && inBuilding.hasPlan && onEnterBuilding && (
          <button type="button" onClick={() => onEnterBuilding(inBuilding.id)} className="w-full min-h-12 px-4 rounded-2xl bg-jade text-on-jade font-bold inline-flex items-center justify-center gap-2 cursor-pointer active:opacity-90">
            <Building2 className="w-5 h-5" />
            {bt.youAreIn(inBuilding.name)} · {bt.seePlan}
          </button>
        )}
        {next && 'inB' in next && next.inB && <p className="text-ink font-semibold">{bt.nextInside(next.num)} · {m.toNext(shortTitle(next.inB.name), roundMeters(next.d))}</p>}
        {next && !('inB' in next && next.inB) && <p className="text-ink font-semibold">{m.toNext(shortTitle(next.s.title), roundMeters(next.d))}</p>}
        {!next && nearest && <p className="text-ink font-semibold">{m.nearest(shortTitle(nearest.s.title), roundMeters(nearest.d))}</p>}
        {here && <p className="text-cap text-ink-3">{m.accuracy(Math.max(5, roundMeters(here.acc)))}</p>}
      </div>

      {sb && (
        <div id="live-building-card" className="mt-3 rounded-2xl bg-surface border border-line p-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-6 h-6 text-jade-ink shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[1.0625rem] font-bold leading-snug">{sb.name}</p>
              <p className="text-cap text-ink-3">{bt.inside(sb.count)}</p>
            </div>
            <button type="button" onClick={() => setSelB(null)} aria-label="×" className="w-9 h-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-ink-3 cursor-pointer active:bg-raised">
              <X className="w-5 h-5" />
            </button>
          </div>
          {onEnterBuilding && sb.hasPlan && (
            <button type="button" id="btn-enter-building" onClick={() => onEnterBuilding(sb.id)} className="btn-primary h-11 px-5 mt-3">
              {bt.enter} · {bt.seePlan}
            </button>
          )}
          {!sb.hasPlan && (
            <ul className="mt-2">
              {sb.stops.map((st) => (
                <li key={st.id}>
                  <button type="button" onClick={() => onOpenStop(st.id)} className="w-full min-h-12 flex items-center gap-3 py-2 text-left border-b border-line cursor-pointer active:bg-raised">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-ink text-bg text-[13px] font-bold flex items-center justify-center tabular-nums">{st.num ?? '·'}</span>
                    <span className="flex-1 min-w-0 text-ui font-semibold text-ink">{st.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {sel && (
        <div id="live-map-card" className="mt-3 rounded-2xl bg-surface border border-line p-4">
          <div className="flex items-start gap-3">
            <p className="flex-1 text-[1.0625rem] font-bold leading-snug">{sel.title}</p>
            <button type="button" onClick={() => setSelected(null)} aria-label="×" className="w-9 h-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-ink-3 cursor-pointer active:bg-raised">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenStop(sel.id)} className="btn-primary h-11 px-5">
              {m.openStop}
            </button>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary h-11 px-5 inline-flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                {m.howTo}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;

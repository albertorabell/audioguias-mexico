import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol, PMTiles, type Source, type RangeResponse } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { LocateFixed, Navigation, X } from 'lucide-react';
import { LiveMapConfig } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { circlePolygon, distanceMeters, roundMeters } from '../utils/geo';
import { walkingMapsUrl } from '../utils/maps';

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

export const LiveMap: React.FC<LiveMapProps> = ({ config, stops, routeIds, currentId, onOpenStop }) => {
  const { strings } = useLanguage();
  const m = strings.ui.map;
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
    const url = registerSource(new URL(config.pmtiles, document.baseURI).href);
    // Mapa claro siempre: se lee mejor con el sol de afuera. Sin letreros salvo los nombres de calles (si el sitio los pide): las letras viajan dentro de la app y todo funciona sin internet.
    const todas = layers('protomaps', namedFlavor('light'), { lang: 'es' }) as any[];
    const baseLayers = todas.filter((l) => l.type !== 'symbol' || (config.labels && String(l.id).includes('roads_labels')));
    const map = new maplibregl.Map({
      container: box.current,
      style: {
        version: 8,
        ...(config.labels ? { glyphs: `${new URL('fonts/', document.baseURI).href}{fontstack}/{range}.pbf` } : {}),
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
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#14b8a6', 'line-width': 4, 'line-dasharray': [1.5, 1.5] } });
      map.addSource('me-acc', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'me-acc-fill', type: 'fill', source: 'me-acc', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 } });
      map.addSource('me', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'me-dot', type: 'circle', source: 'me', paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
      const upd = () => box.current?.classList.toggle('live-zoomed', map.getZoom() >= 16);
      map.on('zoom', upd);
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
        setSelected(s.id);
      });
      markersRef.current.set(s.id, new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map));
    }
    if (!fitted.current && stops.length > 1) {
      fitted.current = true;
      const b = new maplibregl.LngLatBounds();
      stops.forEach((s) => b.extend([s.lng, s.lat]));
      map.fitBounds(b, { padding: 50, maxZoom: 16, duration: 0 });
    }
    const line = routeIds.map((id) => stopById.get(id)).filter(Boolean).map((s) => [s!.lng, s!.lat]);
    (map.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: line.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }] : [],
    });
  }, [stops, routeIds, currentId, ready, stopById]);

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
    const s = i >= 0 ? stopById.get(routeIds[i + 1]) : undefined;
    return s ? { s, d: distanceMeters(here, s) } : null;
  }, [here, currentId, routeIds, stopById]);

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
        {next && <p className="text-ink font-semibold">{m.toNext(shortTitle(next.s.title), roundMeters(next.d))}</p>}
        {!next && nearest && <p className="text-ink font-semibold">{m.nearest(shortTitle(nearest.s.title), roundMeters(nearest.d))}</p>}
        {here && <p className="text-cap text-ink-3">{m.accuracy(Math.max(5, roundMeters(here.acc)))}</p>}
      </div>

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

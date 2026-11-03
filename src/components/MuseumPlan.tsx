import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, LocateFixed, Maximize2, ChevronRight, Lock } from 'lucide-react';
import { Room, PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { ActiveTour } from './RoutesScreen';
import {
  PA_BLOCKS, PA_VIEW, PB_ROOMS, PB_VIEW, PaBase, PbBase, SHORT_ES, baseLabels, roomFill,
} from '../config/mnaPlan';
import { computePlan, legPoints } from '../config/mnaGeo';

type VB = [number, number, number, number];
type Lang = 'es' | 'en' | 'fr' | 'pl' | 'de';
type Mode = 'follow' | 'overview' | 'room' | 'free';

const L: Record<Lang, Record<string, string>> = {
  es: { all: 'Ver todo', center: 'Centrar en mí', zin: 'Acercar', zout: 'Alejar', next: 'Siguiente parada', arrived: 'Llegué', steps: 'pasos', hint: 'Toca una sala para ver sus piezas. Pellizca para acercar y arrastra para mover.', openRoom: 'Abrir sala', pieces: 'piezas', roomWord: 'Sala', upperNote: 'La planta alta se organiza en cinco temas. Toca uno en el plano para ver de qué trata y entra a su sala.', upperRooms: 'Salas de la planta alta', courtyard: 'Patio central', pond: 'Estanque', umbrella: 'El Paraguas', lobby: 'Vestíbulo · taquilla', entrance: 'Entrada principal', temporary: 'Exposiciones temporales', ballgame: 'Juego de pelota', auditorium: 'Auditorio', cloakroom: 'Guardarropa', shop: 'Tienda', aria: 'Plano del Museo Nacional de Antropología', upperAria: 'Plano de la planta alta', here: 'Estás aquí', hold: 'Aproximado: la posición exacta de cada pieza se confirma en sitio.', locked: 'Pieza con el pase', moreLocked: 'más con el pase', unlock: 'Desbloquear con el pase' },
  en: { all: 'Show all', center: 'Center on me', zin: 'Zoom in', zout: 'Zoom out', next: 'Next stop', arrived: "I'm here", steps: 'steps', hint: 'Tap a room to see its pieces. Pinch to zoom and drag to move.', openRoom: 'Open room', pieces: 'pieces', roomWord: 'Room', upperNote: 'The upper floor is organized into five themes. Tap one on the plan to see what it covers and enter its room.', upperRooms: 'Upper floor rooms', courtyard: 'Central courtyard', pond: 'Pond', umbrella: 'The Umbrella', lobby: 'Lobby · tickets', entrance: 'Main entrance', temporary: 'Temporary exhibitions', ballgame: 'Ball court', auditorium: 'Auditorium', cloakroom: 'Cloakroom', shop: 'Shop', aria: 'Plan of the National Museum of Anthropology', upperAria: 'Upper floor plan', here: 'You are here', hold: 'Approximate: each piece position is confirmed on site.', locked: 'Piece with the pass', moreLocked: 'more with the pass', unlock: 'Unlock with the pass' },
  fr: { all: 'Tout voir', center: 'Me centrer', zin: 'Zoomer', zout: 'Dézoomer', next: 'Prochain arrêt', arrived: 'Je suis arrivé', steps: 'pas', hint: 'Touchez une salle pour voir ses pièces. Pincez pour zoomer, glissez pour déplacer.', openRoom: 'Ouvrir la salle', pieces: 'pièces', roomWord: 'Salle', upperNote: "L'étage est organisé en cinq thèmes. Touchez-en un sur le plan pour voir de quoi il s'agit et entrer dans sa salle.", upperRooms: "Salles de l'étage", courtyard: 'Patio central', pond: 'Bassin', umbrella: 'Le Parapluie', lobby: 'Hall · billetterie', entrance: 'Entrée principale', temporary: 'Expositions temporaires', ballgame: 'Jeu de balle', auditorium: 'Auditorium', cloakroom: 'Vestiaire', shop: 'Boutique', aria: "Plan du Musée national d'anthropologie", upperAria: "Plan de l'étage", here: 'Vous êtes ici', hold: 'Approximatif : la position exacte de chaque pièce est confirmée sur place.', locked: 'Pièce avec le pass', moreLocked: 'de plus avec le pass', unlock: 'Débloquer avec le pass' },
  pl: { all: 'Pokaż całość', center: 'Wyśrodkuj', zin: 'Przybliż', zout: 'Oddal', next: 'Następny przystanek', arrived: 'Jestem na miejscu', steps: 'kroków', hint: 'Dotknij sali, aby zobaczyć eksponaty. Szczypnij, aby przybliżyć, i przeciągnij, aby przesunąć.', openRoom: 'Otwórz salę', pieces: 'eksponatów', roomWord: 'Sala', upperNote: 'Piętro dzieli się na pięć tematów. Dotknij jednego na planie, aby zobaczyć, o czym jest, i wejść do jego sali.', upperRooms: 'Sale na piętrze', courtyard: 'Dziedziniec', pond: 'Staw', umbrella: 'Parasol', lobby: 'Hol · kasa', entrance: 'Wejście główne', temporary: 'Wystawy czasowe', ballgame: 'Boisko do gry w piłkę', auditorium: 'Audytorium', cloakroom: 'Szatnia', shop: 'Sklep', aria: 'Plan Narodowego Muzeum Antropologii', upperAria: 'Plan piętra', here: 'Jesteś tutaj', hold: 'Orientacyjnie: dokładne położenie każdego eksponatu potwierdzamy na miejscu.', locked: 'Eksponat z karnetem', moreLocked: 'więcej z karnetem', unlock: 'Odblokuj karnetem' },
  de: { all: 'Alles zeigen', center: 'Auf mich zentrieren', zin: 'Vergrößern', zout: 'Verkleinern', next: 'Nächste Station', arrived: 'Ich bin da', steps: 'Schritte', hint: 'Tippe auf einen Saal, um seine Werke zu sehen. Zum Zoomen zusammenziehen, zum Verschieben ziehen.', openRoom: 'Saal öffnen', pieces: 'Werke', roomWord: 'Saal', upperNote: 'Das Obergeschoss ist in fünf Themen gegliedert. Tippe im Plan auf eines, um zu sehen, worum es geht, und betritt seinen Saal.', upperRooms: 'Säle im Obergeschoss', courtyard: 'Zentraler Innenhof', pond: 'Teich', umbrella: 'Der Schirm', lobby: 'Eingangshalle · Kasse', entrance: 'Haupteingang', temporary: 'Wechselausstellungen', ballgame: 'Ballspielplatz', auditorium: 'Auditorium', cloakroom: 'Garderobe', shop: 'Shop', aria: 'Plan des Nationalmuseums für Anthropologie', upperAria: 'Plan des Obergeschosses', here: 'Du bist hier', hold: 'Ungefähre Angaben: Die genaue Position jedes Werks bestätigen wir vor Ort.', locked: 'Werk mit Pass', moreLocked: 'weitere mit Pass', unlock: 'Mit Pass freischalten' },
};

const MPU = 0.09; // metros por unidad del dibujo (aproximado)
const STEP = 0.7;
const MIN_W = 120;
const MAX_W = 1100;
const clampW = (w: number) => Math.max(MIN_W, Math.min(MAX_W, w));

interface Props {
  rooms: Room[];
  pieces: PieceData[];
  floor: 'PB' | 'PA';
  hereRoomId?: string | null;
  herePieceId?: string | null;
  tour: ActiveTour | null;
  onSelectRoom: (room: Room) => void;
  onOpenPiece?: (pieceId: string) => void;
  onOpenStop?: (index: number) => void;
  /** Sin pase solo se ven las piezas gratis: el resto no muestra nombre ni texto. */
  hasPass?: boolean;
  onOpenPaywall?: () => void;
}

const roomNum = (r: Room) => parseInt(String(r.numero_oficial ?? r.room_id.match(/\d+/)?.[0] ?? '-1'), 10);

export const MuseumPlan: React.FC<Props> = ({ rooms, pieces, floor, hereRoomId, herePieceId, tour, onSelectRoom, onOpenPiece, onOpenStop, hasPass = false, onOpenPaywall }) => {
  const { currentLanguage } = useLanguage();
  const lang = (['es', 'en', 'fr', 'pl', 'de'].includes(currentLanguage) ? currentLanguage : 'es') as Lang;
  const t = L[lang];
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vb, setVbState] = useState<VB>(PB_VIEW);
  const vbRef = useRef<VB>(PB_VIEW);
  const animRef = useRef(0);
  const suppress = useRef(false);
  const [mode, setMode] = useState<Mode>('follow');
  const [sel, setSel] = useState<number | null>(null);
  const [selBlock, setSelBlock] = useState<string | null>(null);

  const roomByNum = useMemo(() => {
    const m = new Map<number, Room>();
    rooms.forEach((r) => m.set(roomNum(r), r));
    return m;
  }, [rooms]);
  const zoneOfRoom = useMemo(() => new Map(rooms.map((r) => [r.room_id, roomNum(r)])), [rooms]);

  // Zona y punto de cada pieza de la planta baja
  const { pos, zoneOf, byZone } = useMemo(() => computePlan(pieces, zoneOfRoom), [pieces, zoneOfRoom]);

  const open = (p: PieceData) => hasPass || p.is_free;
  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p])), [pieces]);
  const stopId = (s: { piece_id?: string; id?: string; poi_id?: string }) => s.piece_id || s.id || s.poi_id || '';
  const stops = useMemo(() => {
    if (!tour) return [] as { i: number; id: string }[];
    return tour.route.stops.map((s, i) => ({ i, id: stopId(s) })).filter((s) => pos.has(s.id));
  }, [tour, pos]);
  const stopIndex = useMemo(() => new Map(stops.map((s) => [s.id, s.i])), [stops]);
  const curIdx = tour ? tour.index : -1;

  const segPts = useCallback((x: string, y: string) => legPoints(pos.get(x)!, zoneOf.get(x)!, pos.get(y)!, zoneOf.get(y)!), [pos, zoneOf]);

  // Dónde está la persona: la pieza abierta, o el centro de su sala
  const here = useMemo<{ at: [number, number]; zone: number } | null>(() => {
    if (floor !== 'PB') return null;
    if (herePieceId && pos.has(herePieceId)) return { at: pos.get(herePieceId)!, zone: zoneOf.get(herePieceId)! };
    const z = hereRoomId ? zoneOfRoom.get(hereRoomId) : undefined;
    const room = z === undefined ? undefined : PB_ROOMS.find((r) => r.num === z);
    return room ? { at: [(room.rect[0] + room.rect[2]) / 2, (room.rect[1] + room.rect[3]) / 2], zone: room.num } : null;
  }, [floor, herePieceId, hereRoomId, pos, zoneOf, zoneOfRoom]);

  // --- cámara ---
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const aspect = size.w ? size.h / size.w : 1.2;

  const setVb = useCallback((v: VB) => { vbRef.current = v; setVbState(v); }, []);
  const animate = useCallback((to: VB, ms = 420) => {
    cancelAnimationFrame(animRef.current);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || ms === 0) { setVb(to); return; }
    const from = vbRef.current, t0 = performance.now();
    const step = (n: number) => {
      const k = Math.min(1, (n - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      setVb(from.map((v, i) => v + (to[i] - v) * e) as VB);
      if (k < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [setVb]);

  const target = useCallback((): VB => {
    const fitH = (cx: number, cy: number, w: number): VB => [cx - w / 2, cy - (w * aspect) / 2, w, w * aspect];
    if (floor === 'PA') {
      const w = Math.max(PA_VIEW[2], PA_VIEW[3] / aspect);
      return [PA_VIEW[0] + PA_VIEW[2] / 2 - w / 2, PA_VIEW[1] + PA_VIEW[3] / 2 - (w * aspect) / 2, w, w * aspect];
    }
    if (mode === 'room' && sel !== null) {
      const r = PB_ROOMS.find((x) => x.num === sel);
      if (r) {
        const [x0, y0, x1, y1] = r.rect;
        let w = x1 - x0 + 160;
        if ((y1 - y0 + 100) / aspect > w) w = (y1 - y0 + 100) / aspect;
        return fitH((x0 + x1) / 2 + (r.side === 'east' ? 30 : r.side === 'west' ? -30 : 0), (y0 + y1) / 2, w);
      }
    }
    if (mode === 'follow' && here) {
      const w = 470;
      return fitH(Math.max(PB_VIEW[0] + w / 2, Math.min(PB_VIEW[0] + PB_VIEW[2] - w / 2, here.at[0])), here.at[1], w);
    }
    // vista completa: que quepa el plano entero
    const w = Math.max(PB_VIEW[2], (PB_VIEW[3]) / aspect);
    return [PB_VIEW[0] + PB_VIEW[2] / 2 - w / 2, PB_VIEW[1] + PB_VIEW[3] / 2 - (w * aspect) / 2, w, w * aspect];
  }, [aspect, floor, mode, sel, here]);

  const first = useRef(true);
  useEffect(() => {
    if (!size.w || mode === 'free') return;
    animate(target(), first.current ? 0 : 420);
    first.current = false;
  }, [size.w, size.h, mode, sel, here?.at[0], here?.at[1], floor]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMode(here ? 'follow' : 'overview'); setSel(null); setSelBlock(null); }, [floor]); // eslint-disable-line react-hooks/exhaustive-deps

  // gestos: arrastrar, pellizcar, rueda
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = () => svg.getBoundingClientRect();
    const toSvg = (px: number, py: number) => { const r = rect(), v = vbRef.current; return [v[0] + ((px - r.left) / r.width) * v[2], v[1] + ((py - r.top) / r.height) * v[3]]; };
    const zoomTo = (px: number, py: number, w: number) => {
      const r = rect(), v = vbRef.current, p = toSvg(px, py), nw = clampW(w), nh = (nw * v[3]) / v[2];
      cancelAnimationFrame(animRef.current);
      setVb([p[0] - ((px - r.left) / r.width) * nw, p[1] - ((py - r.top) / r.height) * nh, nw, nh]);
    };
    let moved = 0, prev: { n: number; d: number; x: number; y: number } | null = null, mouse: { x: number; y: number } | null = null;
    const info = (e: TouchEvent) => {
      const ts = Array.from(e.touches);
      if (ts.length >= 2) { const [a, b] = ts; return { n: 2, d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; }
      return ts.length ? { n: 1, d: 0, x: ts[0].clientX, y: ts[0].clientY } : null;
    };
    const panBy = (dx: number, dy: number) => { const r = rect(), v = vbRef.current; cancelAnimationFrame(animRef.current); setVb([v[0] - (dx * v[2]) / r.width, v[1] - (dy * v[3]) / r.height, v[2], v[3]]); };
    const ts = (e: TouchEvent) => { prev = info(e); if (prev && prev.n === 1) moved = 0; };
    const tm = (e: TouchEvent) => {
      e.preventDefault();
      const c = info(e);
      if (!c) return;
      if (prev && c.n === prev.n) {
        if (c.n === 1) { const dx = c.x - prev.x, dy = c.y - prev.y; moved += Math.abs(dx) + Math.abs(dy); if (moved > 8) { setMode('free'); panBy(dx, dy); } }
        else {
          moved += 20; setMode('free'); cancelAnimationFrame(animRef.current);
          const r = rect(), v = vbRef.current, p = toSvg(prev.x, prev.y), nw = clampW((v[2] * prev.d) / c.d), nh = (nw * v[3]) / v[2];
          setVb([p[0] - ((c.x - r.left) / r.width) * nw, p[1] - ((c.y - r.top) / r.height) * nh, nw, nh]);
        }
      }
      prev = c;
    };
    const te = (e: TouchEvent) => { if (moved > 8) { suppress.current = true; setTimeout(() => { suppress.current = false; }, 400); } prev = info(e); };
    const md = (e: MouseEvent) => { mouse = { x: e.clientX, y: e.clientY }; moved = 0; };
    const mm = (e: MouseEvent) => { if (!mouse) return; const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y; mouse = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { setMode('free'); panBy(dx, dy); } };
    const mu = () => { if (mouse && moved > 6) { suppress.current = true; setTimeout(() => { suppress.current = false; }, 60); } mouse = null; };
    const wh = (e: WheelEvent) => { e.preventDefault(); setMode('free'); zoomTo(e.clientX, e.clientY, vbRef.current[2] * Math.exp(e.deltaY * 0.0018)); };
    const gs = (e: Event) => e.preventDefault();
    const cc = (e: MouseEvent) => { if (suppress.current) { e.stopPropagation(); e.preventDefault(); } };
    svg.addEventListener('touchstart', ts, { passive: true });
    svg.addEventListener('touchmove', tm, { passive: false });
    svg.addEventListener('touchend', te);
    svg.addEventListener('touchcancel', te);
    svg.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    svg.addEventListener('wheel', wh, { passive: false });
    svg.addEventListener('gesturestart', gs);
    svg.addEventListener('gesturechange', gs);
    svg.addEventListener('click', cc, true);
    return () => {
      svg.removeEventListener('touchstart', ts);
      svg.removeEventListener('touchmove', tm);
      svg.removeEventListener('touchend', te);
      svg.removeEventListener('touchcancel', te);
      svg.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      svg.removeEventListener('wheel', wh);
      svg.removeEventListener('gesturestart', gs);
      svg.removeEventListener('gesturechange', gs);
      svg.removeEventListener('click', cc, true);
    };
  }, [setVb]);

  const zoomBy = (f: number) => {
    const v = vbRef.current, w = clampW(v[2] * f), h = (w * v[3]) / v[2];
    setMode('free');
    animate([v[0] + v[2] / 2 - w / 2, v[1] + v[3] / 2 - h / 2, w, h], 250);
  };

  const shortName = (r: Room) => (lang === 'es' ? SHORT_ES[roomNum(r)] : null) || (r.nombre_oficial.length > 13 ? `${r.nombre_oficial.slice(0, 12)}…` : r.nombre_oficial);
  const near = vb[2] <= 340;
  const baseT = baseLabels(t);

  const pickRoom = (n: number) => { setSel(n); setMode('room'); };

  // --- siguiente parada ---
  const nextStop = tour && floor === 'PB' ? tour.route.stops[tour.index + 1] : undefined;
  const nextId = nextStop ? stopId(nextStop) : '';
  const nextPiece = nextId ? pieceById.get(nextId) : undefined;
  const nextOpen = nextPiece ? open(nextPiece) : true;
  const curId = tour ? stopId(tour.route.stops[tour.index] || {}) : '';
  const steps = nextId && curId && pos.has(nextId) && pos.has(curId)
    ? Math.max(3, Math.round((segPts(curId, nextId).reduce((s, p, i, a) => (i ? s + Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) : 0), 0) * MPU) / STEP))
    : null;

  const selRoom = sel !== null ? roomByNum.get(sel) : undefined;
  const selAll = sel !== null ? byZone.get(sel) || [] : [];
  const selList = selAll.filter(open);
  const selLocked = selAll.length - selList.length;
  const upperRooms = rooms.filter((r) => r.piso === 'PA');

  const ink = { fill: 'var(--c-ink)' };
  const youAng = (() => {
    if (!here || !nextId || !pos.has(nextId)) return -90;
    const pts = segPts(curId || herePieceId || nextId, nextId);
    const q = pts[1] || pts[0];
    return (Math.atan2(q[1] - here.at[1], q[0] - here.at[0]) * 180) / Math.PI;
  })();

  return (
    <div id="floor-plan">
      <div ref={wrapRef} className="relative h-[62vh] min-h-[380px] rounded-[20px] bg-surface border border-line overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={vb.join(' ')}
          role="group"
          aria-label={floor === 'PB' ? t.aria : t.upperAria}
          className="w-full h-full block select-none"
          style={{ touchAction: 'none', cursor: 'grab' }}
        >
          {floor === 'PB' ? (
            <>
              <PbBase />
              {baseT.map((l) => (
                <text key={l.s} x={l.x} y={l.y} textAnchor="middle" fontSize={l.size} fontWeight={l.bold ? 700 : 600} fill="var(--c-ink-3)" pointerEvents="none">{l.s}</text>
              ))}
              {PB_ROOMS.map((r) => {
                const room = roomByNum.get(r.num);
                const isHere = here?.zone === r.num;
                const [x0, y0, x1, y1] = r.rect;
                const name = room ? shortName(room) : SHORT_ES[r.num];
                const nameLines = name.split(' ').reduce<string[]>((a, w) => { const l = a[a.length - 1]; if (l && `${l} ${w}`.length > 11) a.push(w); else a[a.length - 1] = l ? `${l} ${w}` : w; return a; }, ['']);
                return (
                  <g key={r.num}>
                    <rect
                      x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={8}
                      fill={roomFill(r.hue, isHere || sel === r.num)}
                      stroke={isHere || sel === r.num ? 'var(--c-jade)' : 'var(--c-ink-3)'}
                      strokeWidth={isHere || sel === r.num ? 5 : 2}
                      style={{ cursor: 'pointer' }}
                      onClick={() => pickRoom(r.num)}
                      aria-label={`${t.roomWord} ${r.num}, ${name}`}
                    />
                    {r.side === 'east' && (<>
                      <text x={x1 + 10} y={y0 + 40} fontSize={38} fontWeight={700} {...ink} pointerEvents="none" className="font-serif">{r.num}</text>
                      <text x={x1 + 10} y={y0 + 62} fontSize={16} fontWeight={600} fill="var(--c-ink-3)" pointerEvents="none">{name}</text>
                    </>)}
                    {r.side === 'west' && (<>
                      <text x={x0 - 10} y={y0 + 40} fontSize={38} fontWeight={700} {...ink} textAnchor="end" pointerEvents="none" className="font-serif">{r.num}</text>
                      {nameLines.map((s, i) => <text key={s} x={x0 - 10} y={y0 + 62 + i * 19} fontSize={16} fontWeight={600} fill="var(--c-ink-3)" textAnchor="end" pointerEvents="none">{s}</text>)}
                    </>)}
                    {r.side === 'inside' && (<>
                      <text x={x0 + 16} y={y0 + 44} fontSize={38} fontWeight={700} {...ink} pointerEvents="none" className="font-serif">{r.num}</text>
                      <text x={x0 + 62} y={y0 + 44} fontSize={19} fontWeight={600} fill="var(--c-ink-3)" pointerEvents="none">{name}</text>
                    </>)}
                  </g>
                );
              })}
              {/* camino de la ruta activa */}
              {stops.slice(0, -1).map((s, k) => {
                const nx = stops[k + 1];
                const d = `M${segPts(s.id, nx.id).map((p) => p.join(' ')).join('L')}`;
                const done = s.i < curIdx;
                return <path key={s.id + nx.id} d={d} fill="none" stroke={done ? 'var(--c-ink-3)' : 'var(--c-jade)'} strokeWidth={done ? 5 : 7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={done ? undefined : '14 14'} opacity={done ? 0.7 : s.i === curIdx ? 1 : 0.55} />;
              })}
              {/* todas las piezas como puntos; al acercarse llevan su número de recorrido en la sala */}
              {Array.from(byZone.entries()).flatMap(([z, list]) => list.map((p, i) => {
                if (stopIndex.has(p.piece_id) || !open(p)) return null;
                const [x, y] = pos.get(p.piece_id)!;
                return (
                  <g key={p.piece_id} style={{ cursor: 'pointer' }} onClick={() => onOpenPiece?.(p.piece_id)}>
                    <circle cx={x} cy={y} r={near ? 13 : 7} fill="var(--c-ink-3)" opacity={near ? 0.9 : 0.55} stroke="var(--c-surface)" strokeWidth={near ? 3 : 0} />
                    {near && z >= 1 && <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--c-surface)" pointerEvents="none">{i + 1}</text>}
                    <circle cx={x} cy={y} r={22} fill="transparent" />
                  </g>
                );
              }))}
              {/* paradas de la ruta */}
              {stops.map((s) => {
                const [x, y] = pos.get(s.id)!;
                const done = s.i < curIdx, next = s.i === curIdx + 1;
                return (
                  <g key={s.id} style={{ cursor: 'pointer' }} onClick={() => onOpenPiece?.(s.id)}>
                    {next && <circle cx={x} cy={y} r={22} fill="none" stroke="var(--c-jade)" strokeWidth={2} opacity={0.6} />}
                    <circle cx={x} cy={y} r={next ? 18 : 14} fill={done ? 'var(--c-ink-3)' : next ? 'var(--c-jade)' : 'var(--c-ink)'} stroke="var(--c-surface)" strokeWidth={3} />
                    <text x={x} y={y + (next ? 7 : 5.5)} textAnchor="middle" fontSize={next ? 19 : 15} fontWeight={700} fill={next ? 'var(--c-on-jade)' : 'var(--c-bg)'} pointerEvents="none">{done ? '✓' : s.i + 1}</text>
                    <circle cx={x} cy={y} r={26} fill="transparent" />
                  </g>
                );
              })}
              {/* tú */}
              {here && (
                <g transform={`translate(${here.at[0]} ${here.at[1]})`} pointerEvents="none">
                  <circle r={30} fill="#1d4ed8" opacity={0.18} />
                  <circle r={13} fill="#1d4ed8" stroke="#fff" strokeWidth={4} />
                  <path d="M44 0 L26 -12 L26 12 Z" fill="#1d4ed8" transform={`rotate(${youAng})`} />
                </g>
              )}
            </>
          ) : (
            <g>
              <PaBase />
              {PA_BLOCKS.map((b) => {
                const [x0, y0, x1, y1] = b.rect;
                const words = b.title[lang].split(' ');
                const m = Math.ceil(words.length / 2);
                const on = selBlock === b.id;
                const fill = roomFill(b.hue, on);
                const stroke = on ? 'var(--c-jade)' : 'var(--c-ink-2)';
                const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
                return (
                  <g key={b.id} style={{ cursor: 'pointer' }} onClick={() => setSelBlock(b.id)}>
                    {b.poly
                      ? <polygon points={b.poly} fill={fill} stroke={stroke} strokeWidth={on ? 5 : 3} strokeLinejoin="round" />
                      : <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={6} fill={fill} stroke={stroke} strokeWidth={on ? 5 : 3} />}
                    {[words.slice(0, m).join(' '), words.slice(m).join(' ')].map((s, k) => <text key={k} x={cx} y={cy + k * 22 - 4} textAnchor="middle" fontSize={18} fontWeight={700} {...ink} pointerEvents="none">{s}</text>)}
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        <div className="absolute right-2.5 top-2.5 flex flex-col gap-2">
          {([['zin', Plus, () => zoomBy(0.6)], ['zout', Minus, () => zoomBy(1.7)]] as const).map(([k, Icon, fn]) => (
            <button key={k} type="button" aria-label={t[k]} onClick={fn} className="w-11 h-11 rounded-full bg-surface border border-line shadow-md flex items-center justify-center text-ink cursor-pointer active:bg-raised">
              <Icon className="w-5 h-5" />
            </button>
          ))}
          {floor === 'PB' && here && (
            <button type="button" aria-label={t.center} onClick={() => { setSel(null); setMode('follow'); }} className={`w-11 h-11 rounded-full border shadow-md flex items-center justify-center cursor-pointer ${mode === 'free' ? 'bg-jade text-on-jade border-jade' : 'bg-surface text-ink border-line active:bg-raised'}`}>
              <LocateFixed className="w-5 h-5" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => { setSel(null); setMode('overview'); }} className="absolute left-2.5 bottom-2.5 h-11 px-4 rounded-full bg-surface border border-line shadow-md text-ui font-semibold text-ink inline-flex items-center gap-2 cursor-pointer active:bg-raised">
          <Maximize2 className="w-4 h-4" />
          {t.all}
        </button>
      </div>

      <div className="mt-3 rounded-[20px] bg-surface border border-line p-4">
        {floor === 'PA' ? (
          <>
            {selBlock ? <p className="font-serif text-h3 text-ink">{PA_BLOCKS.find((b) => b.id === selBlock)?.title[lang]}</p> : null}
            <p className="text-cap text-ink-3 mt-1">{t.upperNote}</p>
            {upperRooms.length > 0 && (
              <>
                <p className="mt-4 text-ui font-semibold text-ink">{t.upperRooms}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {upperRooms.map((r) => (
                    <button key={r.room_id} type="button" onClick={() => onSelectRoom(r)} className="min-h-11 px-3 rounded-full border border-line bg-bg text-ui font-semibold text-ink cursor-pointer active:bg-raised">
                      {roomNum(r)} · {r.nombre_oficial}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : sel !== null && selRoom ? (
          <>
            <div className="flex items-start gap-3">
              <span className="font-serif text-[2rem] leading-none text-ink tabular-nums">{sel}</span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-h3 text-ink leading-tight">{selRoom.nombre_oficial}</p>
                <p className="text-cap text-ink-3">{selAll.length} {t.pieces}</p>
              </div>
              <button type="button" id="btn-plan-open-room" onClick={() => onSelectRoom(selRoom)} className="min-h-11 px-3 rounded-full border border-jade/40 text-ui font-semibold text-jade-ink cursor-pointer active:bg-raised">{t.openRoom}</button>
            </div>
            <ul className="mt-2">
              {selList.map((p, i) => (
                <li key={p.piece_id}>
                  <button type="button" onClick={() => onOpenPiece?.(p.piece_id)} className="w-full min-h-12 flex items-center gap-3 py-2 text-left border-b border-line cursor-pointer active:bg-raised">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-ink text-bg text-[13px] font-bold flex items-center justify-center tabular-nums">{i + 1}</span>
                    <span className="flex-1 min-w-0 text-ui font-semibold text-ink">{p.titulo}</span>
                    <ChevronRight className="w-4 h-4 text-ink-3 shrink-0" />
                  </button>
                </li>
              ))}
              {selLocked > 0 && (
                <li>
                  <button type="button" onClick={() => onOpenPaywall?.()} className="w-full min-h-12 flex items-center gap-3 py-2 text-left border-b border-line cursor-pointer active:bg-raised">
                    <Lock className="w-5 h-5 shrink-0 text-ink-3" />
                    <span className="flex-1 min-w-0 text-ui font-semibold text-ink-2">+{selLocked} {t.moreLocked}</span>
                    <span className="text-cap font-semibold text-jade-ink">{t.unlock}</span>
                  </button>
                </li>
              )}
            </ul>
            <p className="mt-2 text-cap text-ink-3">{t.hold}</p>
          </>
        ) : nextPiece ? (
          <>
            <p className="text-cap text-ink-3">{t.next}</p>
            <p className="font-serif text-h3 text-ink leading-tight mt-0.5">{nextOpen ? nextPiece.titulo : t.locked}</p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5">
              {steps !== null && <span className="font-serif text-[1.375rem] leading-none text-jade-ink tabular-nums whitespace-nowrap">≈ {steps} {t.steps}</span>}
              <span className="text-cap text-ink-2 line-clamp-3">
                {zoneOf.get(nextId) !== undefined && zoneOf.get(nextId) !== zoneOf.get(curId) ? `${t.roomWord} ${zoneOf.get(nextId)}. ` : ''}
                {nextOpen ? nextPiece.puente_narrativo : ''}
              </span>
            </div>
            <button type="button" onClick={() => tour && onOpenStop?.(tour.index + 1)} className="mt-3 w-full min-h-12 rounded-2xl bg-jade text-on-jade text-ui font-bold cursor-pointer active:opacity-90">{t.arrived}</button>
          </>
        ) : (
          <p className="text-cap text-ink-3">{t.hint}</p>
        )}
      </div>
    </div>
  );
};

export default MuseumPlan;

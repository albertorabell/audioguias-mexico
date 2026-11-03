import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, LocateFixed, Maximize2, ChevronRight, Lock } from 'lucide-react';
import { PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { ActiveTour } from './RoutesScreen';
import { PLAN_UI, PlanFloor, PlanLang, PlanPin, Rect, SitePlan } from '../config/sitePlan';

type Mode = 'follow' | 'overview' | 'area' | 'free';

const LANGS: PlanLang[] = ['es', 'en', 'fr', 'pl', 'de', 'pt', 'it'];

interface Props {
  plan: SitePlan;
  pieces: PieceData[];
  floor: PlanFloor;
  onFloorChange: (f: PlanFloor) => void;
  herePieceId?: string | null;
  tour: ActiveTour | null;
  hasPass?: boolean;
  onOpenPaywall?: () => void;
  onOpenPiece?: (pieceId: string) => void;
  onOpenStop?: (index: number) => void;
}

const stopId = (s: { piece_id?: string; id?: string; poi_id?: string }) => s.piece_id || s.id || s.poi_id || '';

/** Plano de un sitio con paradas ubicadas con exactitud (estándar de planos). Lee todo de la configuración del sitio. */
export const SitePlanView: React.FC<Props> = ({ plan, pieces, floor, onFloorChange, herePieceId, tour, hasPass = false, onOpenPaywall, onOpenPiece, onOpenStop }) => {
  const { currentLanguage } = useLanguage();
  const lang = (LANGS.includes(currentLanguage as PlanLang) ? currentLanguage : 'es') as PlanLang;
  const t = PLAN_UI[lang];
  const fl = plan.floors[floor] ?? plan.floors.PB!;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vb, setVbState] = useState<Rect>(fl.view);
  const vbRef = useRef<Rect>(fl.view);
  const animRef = useRef(0);
  const suppress = useRef(false);
  const [mode, setMode] = useState<Mode>('overview');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p])), [pieces]);
  const pinList = useMemo<[string, PlanPin][]>(() => Object.keys(plan.pins).map((k): [string, PlanPin] => [k, plan.pins[k]]), [plan]);
  const open = (p: PieceData) => hasPass || p.is_free;
  const floorsAvailable = (['PB', 'PA'] as PlanFloor[]).filter((f) => plan.floors[f] && pinList.some(([id, p]) => p.floor === f && pieceById.has(id)));

  // paradas del recorrido activo con su posición
  const stops = useMemo(() => {
    if (!tour) return [] as { i: number; id: string }[];
    return tour.route.stops.map((s, i) => ({ i, id: stopId(s) })).filter((s) => plan.pins[s.id]);
  }, [tour, plan]);
  const stopIndex = useMemo(() => new Map(stops.map((s) => [s.id, s.i])), [stops]);
  const curIdx = tour ? tour.index : -1;
  const herePin = herePieceId ? plan.pins[herePieceId] : undefined;

  // al abrir una parada, el plano muestra su planta
  useEffect(() => { if (herePin && herePin.floor !== floor) onFloorChange(herePin.floor); }, [herePieceId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const setVb = useCallback((v: Rect) => { vbRef.current = v; setVbState(v); }, []);
  const animate = useCallback((to: Rect, ms = 420) => {
    cancelAnimationFrame(animRef.current);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || ms === 0) { setVb(to); return; }
    const from = vbRef.current, t0 = performance.now();
    const step = (n: number) => {
      const k = Math.min(1, (n - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      setVb(from.map((v, i) => v + (to[i] - v) * e) as Rect);
      if (k < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [setVb]);

  const fit = useCallback((r: Rect): Rect => {
    const w = Math.max(r[2], r[3] / aspect);
    return [r[0] + r[2] / 2 - w / 2, r[1] + r[3] / 2 - (w * aspect) / 2, w, w * aspect];
  }, [aspect]);
  const MIN_W = 70, MAX_W = fl.size[0] * 1.4;
  const clampW = (w: number) => Math.max(MIN_W, Math.min(MAX_W, w));

  const target = useCallback((): Rect => {
    if (mode === 'area' && areaId) {
      const a = plan.areas.find((x) => x.id === areaId);
      if (a) return fit(a.view);
    }
    if (mode === 'follow' && herePin && herePin.floor === floor) {
      const w = 170;
      return [herePin.at[0] - w / 2, herePin.at[1] - (w * aspect) / 2, w, w * aspect];
    }
    return fit(fl.view);
  }, [mode, areaId, herePin, floor, aspect, fit, fl, plan.areas]);

  const first = useRef(true);
  useEffect(() => {
    if (!size.w || mode === 'free') return;
    animate(target(), first.current ? 0 : 420);
    first.current = false;
  }, [size.w, size.h, mode, areaId, floor, herePieceId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMode(herePin && herePin.floor === floor ? 'follow' : 'overview'); setAreaId(null); setSel(null); }, [floor]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (herePin) { setMode('follow'); setSel(null); } }, [herePieceId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [setVb, MAX_W]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (f: number) => {
    const v = vbRef.current, w = clampW(v[2] * f), h = (w * v[3]) / v[2];
    setMode('free');
    animate([v[0] + v[2] / 2 - w / 2, v[1] + v[3] / 2 - h / 2, w, h], 250);
  };

  const near = vb[2] <= 150;
  const pinsHere = pinList.filter(([id, p]) => p.floor === floor && pieceById.has(id));

  const nextStop = tour ? tour.route.stops[tour.index + 1] : undefined;
  const nextId = nextStop ? stopId(nextStop) : '';
  const nextPiece = nextId ? pieceById.get(nextId) : undefined;
  const nextPin = nextId ? plan.pins[nextId] : undefined;
  const selPiece = sel ? pieceById.get(sel) : undefined;
  const ink = 'var(--c-ink)';

  const areas = plan.areas.filter((a) => a.floor === floor);

  return (
    <div id="floor-plan">
      {floorsAvailable.length > 1 && (
        <div role="tablist" className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-line mb-3">
          {floorsAvailable.map((f) => (
            <button key={f} type="button" role="tab" id={`plan-floor-${f}`} aria-selected={floor === f} onClick={() => onFloorChange(f)} className={`min-h-11 rounded-xl text-ui font-bold cursor-pointer transition-colors ${floor === f ? 'bg-raised text-ink shadow-sm' : 'text-ink-3'}`}>
              {plan.floors[f]!.name[lang]}
            </button>
          ))}
        </div>
      )}
      <div ref={wrapRef} className="relative h-[62vh] min-h-[380px] rounded-[20px] bg-surface border border-line overflow-hidden">
        <svg ref={svgRef} viewBox={vb.join(' ')} role="group" aria-label={plan.aria[lang]} className="w-full h-full block select-none" style={{ touchAction: 'none', cursor: 'grab' }}>
          <rect x={-400} y={-400} width={1400} height={1800} fill="#f8f8f8" className="dark:[filter:invert(0.9)_hue-rotate(180deg)]" pointerEvents="none" />
          <image href={fl.img} x={0} y={0} width={fl.size[0]} height={fl.size[1]} className="dark:[filter:invert(0.9)_hue-rotate(180deg)]" pointerEvents="none" />
          {/* camino de la ruta activa (solo entre paradas consecutivas de esta planta) */}
          {stops.slice(0, -1).map((s, k) => {
            const nx = stops[k + 1];
            const a = plan.pins[s.id], b = plan.pins[nx.id];
            if (nx.i !== s.i + 1 || a.floor !== floor || b.floor !== floor) return null;
            const done = s.i < curIdx;
            return <line key={s.id + nx.id} x1={a.at[0]} y1={a.at[1]} x2={b.at[0]} y2={b.at[1]} stroke={done ? 'var(--c-ink-3)' : 'var(--c-jade)'} strokeWidth={done ? 2 : 2.6} strokeLinecap="round" strokeDasharray={done ? undefined : '5 5'} opacity={done ? 0.7 : s.i === curIdx ? 1 : 0.55} />;
          })}
          {/* todas las paradas como puntos numerados (número de la visita completa) */}
          {pinsHere.map(([id, p]) => {
            if (stopIndex.has(id)) return null;
            const pc = pieceById.get(id)!;
            const on = sel === id;
            const n = pc.orden_sugerido;
            const r = on ? 8.6 : 7;
            return (
              <g key={id} style={{ cursor: 'pointer' }} onClick={() => setSel(id)} aria-label={open(pc) ? pc.titulo : t.locked}>
                <circle cx={p.at[0]} cy={p.at[1]} r={r} fill="var(--c-ink-2)" opacity={on ? 1 : 0.85} stroke={on ? 'var(--c-jade)' : 'var(--c-surface)'} strokeWidth={on ? 2.2 : 1.4} strokeDasharray={p.approx ? '2 1.6' : undefined} />
                {n ? <text x={p.at[0]} y={p.at[1] + 2.8} textAnchor="middle" fontSize={n > 9 ? 7 : 8} fontWeight={700} fill="var(--c-bg)" pointerEvents="none">{n}</text> : null}
                {(near || on) && open(pc) && (
                  <text x={p.at[0]} y={p.at[1] - r - 3} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="var(--c-ink)" stroke="var(--c-surface)" strokeWidth={2.4} paintOrder="stroke" pointerEvents="none">{pc.titulo.length > 26 ? `${pc.titulo.slice(0, 25)}…` : pc.titulo}</text>
                )}
                <circle cx={p.at[0]} cy={p.at[1]} r={12} fill="transparent" />
              </g>
            );
          })}
          {/* paradas de la ruta, numeradas */}
          {stops.filter((s) => plan.pins[s.id].floor === floor).map((s) => {
            const p = plan.pins[s.id];
            const [x, y] = p.at;
            const done = s.i < curIdx, next = s.i === curIdx + 1, on = sel === s.id;
            const r = next ? 9 : 7.4;
            return (
              <g key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSel(s.id)}>
                {(next || on) && <circle cx={x} cy={y} r={r + 4.5} fill="none" stroke="var(--c-jade)" strokeWidth={1.2} opacity={0.7} />}
                <circle cx={x} cy={y} r={r} fill={done ? 'var(--c-ink-3)' : next ? 'var(--c-jade)' : ink} stroke="var(--c-surface)" strokeWidth={1.6} strokeDasharray={p.approx ? '2.4 1.8' : undefined} />
                <text x={x} y={y + (next ? 3.6 : 3)} textAnchor="middle" fontSize={next ? 9.5 : 8} fontWeight={700} fill={next ? 'var(--c-on-jade)' : 'var(--c-bg)'} pointerEvents="none">{done ? '✓' : s.i + 1}</text>
                <circle cx={x} cy={y} r={13} fill="transparent" />
              </g>
            );
          })}
          {/* tú */}
          {herePin && herePin.floor === floor && (
            <g transform={`translate(${herePin.at[0]} ${herePin.at[1]})`} pointerEvents="none">
              <circle r={15} fill="#1d4ed8" opacity={0.18} />
              <circle r={6.5} fill="#1d4ed8" stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>

        <div className="absolute right-2.5 top-2.5 flex flex-col gap-2">
          {([['zin', Plus, () => zoomBy(0.6)], ['zout', Minus, () => zoomBy(1.7)]] as const).map(([k, Icon, fn]) => (
            <button key={k} type="button" aria-label={t[k]} onClick={fn} className="w-11 h-11 rounded-full bg-surface border border-line shadow-md flex items-center justify-center text-ink cursor-pointer active:bg-raised">
              <Icon className="w-5 h-5" />
            </button>
          ))}
          {herePin && herePin.floor === floor && (
            <button type="button" aria-label={t.center} onClick={() => { setAreaId(null); setMode('follow'); }} className={`w-11 h-11 rounded-full border shadow-md flex items-center justify-center cursor-pointer ${mode === 'free' ? 'bg-jade text-on-jade border-jade' : 'bg-surface text-ink border-line active:bg-raised'}`}>
              <LocateFixed className="w-5 h-5" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => { setAreaId(null); setSel(null); setMode('overview'); }} className="absolute left-2.5 bottom-2.5 h-11 px-4 rounded-full bg-surface border border-line shadow-md text-ui font-semibold text-ink inline-flex items-center gap-2 cursor-pointer active:bg-raised">
          <Maximize2 className="w-4 h-4" />
          {t.all}
        </button>
      </div>

      {areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.map((a) => (
            <button key={a.id} type="button" onClick={() => { setAreaId(a.id); setMode('area'); }} className={`min-h-11 px-3 rounded-full border text-ui font-semibold cursor-pointer active:bg-raised ${areaId === a.id && mode === 'area' ? 'border-jade bg-raised text-ink' : 'border-line bg-bg text-ink'}`}>
              {a.name[lang]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-[20px] bg-surface border border-line p-4">
        {selPiece ? (
          <>
            <button type="button" onClick={() => onOpenPiece?.(selPiece.piece_id)} disabled={!open(selPiece)} className="w-full flex items-center gap-3 text-left cursor-pointer disabled:cursor-default">
              <span className="flex-1 min-w-0">
                <span className="block text-cap text-ink-3">{t.stopWord}{stopIndex.has(selPiece.piece_id) ? ` ${(stopIndex.get(selPiece.piece_id) ?? 0) + 1}` : ''}</span>
                <span className="block font-serif text-h3 text-ink leading-tight">{open(selPiece) ? selPiece.titulo : t.locked}</span>
              </span>
              {open(selPiece) ? <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" /> : <Lock className="w-5 h-5 text-ink-3 shrink-0" />}
            </button>
            {!open(selPiece) && (
              <button type="button" onClick={() => onOpenPaywall?.()} className="mt-3 w-full min-h-12 rounded-2xl bg-jade text-on-jade text-ui font-bold cursor-pointer active:opacity-90">{t.unlock}</button>
            )}
            {plan.pins[selPiece.piece_id]?.approx && <p className="mt-2 text-cap text-ink-3">{t.approx}</p>}
          </>
        ) : nextPiece ? (
          <>
            <p className="text-cap text-ink-3">{t.next}</p>
            <p className="font-serif text-h3 text-ink leading-tight mt-0.5">{open(nextPiece) ? nextPiece.titulo : t.locked}</p>
            <div className="mt-3 rounded-2xl bg-bg px-3 py-2.5">
              {nextPin && nextPin.floor !== floor ? (
                <button type="button" onClick={() => onFloorChange(nextPin.floor)} className="text-cap font-semibold text-jade-ink cursor-pointer">{nextPin.floor === 'PA' ? t.goUp : t.goDown} · {t.otherFloor}</button>
              ) : (
                <span className="text-cap text-ink-2 line-clamp-3">{open(nextPiece) ? nextPiece.puente_narrativo : ''}</span>
              )}
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

export default SitePlanView;

import React, { useMemo } from 'react';
import { Footprints } from 'lucide-react';
import { Room } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { PB_IMG, PB_ROOMS, PB_SIZE } from '../config/mnaPlan';
import { ENTRANCE, ENTRANCE_ZONE, computePlan, legPoints, stepsOf } from '../config/mnaGeo';

type Lang = 'es' | 'en' | 'fr' | 'pl' | 'de';
export type PlanGeo = ReturnType<typeof computePlan>;

const T: Record<Lang, Record<string, string>> = {
  es: { arrive: 'Cómo llegar aquí', next: 'Cómo llegar a la siguiente', entrance: 'Desde la entrada principal', steps: 'pasos', room: 'Sala', same: 'En la misma sala', front: 'de frente', right: 'a tu derecha', left: 'a tu izquierda', back: 'detrás de ti, date la vuelta', east: 'ala derecha del museo (entrando, a tu derecha)', west: 'ala izquierda del museo (entrando, a tu izquierda)', far: 'al fondo del museo, pasando el patio', z0: 'afuera, en la explanada', z05: 'en el vestíbulo', z07: 'en el patio central', approx: 'Aproximado' },
  en: { arrive: 'How to get here', next: 'How to get to the next one', entrance: 'From the main entrance', steps: 'steps', room: 'Room', same: 'In the same room', front: 'straight ahead', right: 'on your right', left: 'on your left', back: 'behind you, turn around', east: 'right wing of the museum (as you enter, on your right)', west: 'left wing of the museum (as you enter, on your left)', far: 'at the back of the museum, past the courtyard', z0: 'outside, on the plaza', z05: 'in the lobby', z07: 'in the central courtyard', approx: 'Approximate' },
  fr: { arrive: 'Comment y arriver', next: 'Comment aller à la suivante', entrance: "Depuis l'entrée principale", steps: 'pas', room: 'Salle', same: 'Dans la même salle', front: 'tout droit', right: 'à votre droite', left: 'à votre gauche', back: 'derrière vous, faites demi-tour', east: "aile droite du musée (en entrant, à votre droite)", west: "aile gauche du musée (en entrant, à votre gauche)", far: 'au fond du musée, après le patio', z0: "dehors, sur l'esplanade", z05: 'dans le hall', z07: 'dans le patio central', approx: 'Approximatif' },
  pl: { arrive: 'Jak tu dojść', next: 'Jak dojść do następnego', entrance: 'Od głównego wejścia', steps: 'kroków', room: 'Sala', same: 'W tej samej sali', front: 'prosto przed siebie', right: 'po prawej', left: 'po lewej', back: 'za tobą, zawróć', east: 'prawe skrzydło muzeum (po wejściu, po prawej)', west: 'lewe skrzydło muzeum (po wejściu, po lewej)', far: 'w głębi muzeum, za dziedzińcem', z0: 'na zewnątrz, na placu', z05: 'w holu', z07: 'na dziedzińcu', approx: 'Orientacyjnie' },
  de: { arrive: 'So kommst du hierher', next: 'So kommst du zum nächsten', entrance: 'Vom Haupteingang', steps: 'Schritte', room: 'Saal', same: 'Im selben Saal', front: 'geradeaus', right: 'rechts von dir', left: 'links von dir', back: 'hinter dir, dreh dich um', east: 'rechter Flügel des Museums (beim Eintreten rechts)', west: 'linker Flügel des Museums (beim Eintreten links)', far: 'im hinteren Teil des Museums, hinter dem Innenhof', z0: 'draußen, auf dem Vorplatz', z05: 'in der Eingangshalle', z07: 'im zentralen Innenhof', approx: 'Ungefähr' },
};

const HEAD: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function relative(lang: Lang, head: [number, number], a: [number, number], b: [number, number]) {
  const t = T[lang];
  const v: [number, number] = [b[0] - a[0], b[1] - a[1]];
  const ang = (Math.atan2(head[0] * v[1] - head[1] * v[0], head[0] * v[0] + head[1] * v[1]) * 180) / Math.PI; // + = derecha (y hacia abajo)
  if (Math.abs(ang) < 25) return t.front;
  if (Math.abs(ang) > 140) return t.back;
  return ang > 0 ? t.right : t.left;
}

interface Props {
  id: string;
  kind: 'arrive' | 'next';
  geo: PlanGeo;
  rooms: Room[];
  /** Pieza de la que se viene; null = desde la entrada principal. */
  fromId: string | null;
  toId: string;
}

/** Tarjeta "cómo llegar": mini-mapa recortado con el camino y una frase corta (sala, lado del museo y pasos). */
export const PlanGuide: React.FC<Props> = ({ id, kind, geo, rooms, fromId, toId }) => {
  const { currentLanguage } = useLanguage();
  const lang = (['es', 'en', 'fr', 'pl', 'de'].includes(currentLanguage) ? currentLanguage : 'es') as Lang;
  const t = T[lang];

  const data = useMemo(() => {
    const b = geo.pos.get(toId);
    const zb = geo.zoneOf.get(toId);
    if (!b || zb === undefined) return null;
    const a = fromId ? geo.pos.get(fromId) : ENTRANCE;
    const za = fromId ? geo.zoneOf.get(fromId) : ENTRANCE_ZONE;
    if (!a || za === undefined) return null;
    const pts = legPoints(a, za, b, zb);
    const steps = stepsOf(pts);
    const roomOf = (z: number) => rooms.find((r) => parseInt(String(r.numero_oficial), 10) === z);
    const rb = PB_ROOMS.find((r) => r.num === zb);
    let line: string;
    if (za === zb && zb >= 1) {
      line = `${t.same}: ${relative(lang, HEAD[rb?.flow || 'up'], a, b)}.`;
    } else if (zb >= 1) {
      const name = roomOf(zb)?.nombre_oficial || '';
      const where = zb === 6 ? t.far : rb?.side === 'west' ? t.west : t.east;
      line = `${t.room} ${zb}${name ? ` · ${name}` : ''}: ${where}.`;
    } else {
      line = `${zb === 0 ? t.z0 : zb === 0.5 ? t.z05 : t.z07}.`;
      line = line.charAt(0).toUpperCase() + line.slice(1);
    }
    // recorte cuadrado alrededor del camino
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const size = Math.max(300, Math.max(x1 - x0, y1 - y0) + 140);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const vb = [cx - size / 2, cy - size / 2, size, size];
    return { pts, steps, line, vb, a, b, size };
  }, [geo, rooms, fromId, toId, lang, t]);

  if (!data) return null;
  const r = data.size / 28;
  return (
    <div id={id} className="mt-4 rounded-2xl bg-raised border border-line p-3 flex gap-3 items-stretch">
      <svg viewBox={data.vb.join(' ')} className="w-[7.25rem] h-[7.25rem] shrink-0 rounded-xl bg-surface border border-line" role="img" aria-label={t[kind]}>
        <image href={PB_IMG} x={0} y={0} width={PB_SIZE[0]} height={PB_SIZE[1]} className="dark:[filter:invert(0.9)_hue-rotate(180deg)]" />
        <path d={`M${data.pts.map((p) => p.join(' ')).join('L')}`} fill="none" stroke="var(--c-jade)" strokeWidth={r * 0.55} strokeDasharray={`${r * 1.1} ${r * 1.1}`} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={data.a[0]} cy={data.a[1]} r={r * 0.8} fill="var(--c-ink-3)" stroke="var(--c-surface)" strokeWidth={r * 0.3} />
        <circle cx={data.b[0]} cy={data.b[1]} r={r * 1.15} fill="var(--c-jade)" stroke="var(--c-surface)" strokeWidth={r * 0.35} />
      </svg>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="flex items-center gap-2 text-cap font-semibold text-jade-ink">
          <Footprints className="w-4 h-4" strokeWidth={2.25} />
          {t[kind]}
        </p>
        <p className="mt-1 text-ui leading-snug text-ink">{data.line}</p>
        <p className="mt-1 text-cap text-ink-3">
          {fromId ? '' : `${t.entrance} · `}≈ {data.steps} {t.steps} · {t.approx}
        </p>
      </div>
    </div>
  );
};

export default PlanGuide;

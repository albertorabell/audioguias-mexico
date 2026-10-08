import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Pause, Play, ChevronDown, AlertCircle, X } from 'lucide-react';
import { Room, PieceData } from '../types';
import { ttsPlayer } from '../utils/ttsPlayer';
import { PieceImage } from './PieceImage';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { getRoomShortLabel, getRoomLabel } from '../utils/roomLabel';
import { useLanguage } from '../utils/LanguageContext';
import { roomScriptLanguage } from '../i18n/content';
import { TopBar } from './ui/TopBar';
import { PassButton } from './ui/HeaderControls';

interface RoomViewProps {
  room: Room;
  /** Piezas de la sala, ya en el orden en que se recorren. */
  pieces: PieceData[];
  hasPass: boolean;
  /** Pieza en la que va la persona, para marcarla. */
  currentPieceId?: string | null;
  onBack: () => void;
  backLabel?: string;
  onOpenPaywall: () => void;
  onSelectPiece: (pieceId: string) => void;
}

/** Una sala: número grande como la señalética del museo, su introducción y sus obras en orden. */
export const RoomView: React.FC<RoomViewProps> = ({
  room,
  pieces,
  hasPass,
  currentPieceId,
  onBack,
  backLabel,
  onOpenPaywall,
  onSelectPiece,
}) => {
  const { strings, currentLanguage } = useLanguage();
  const u = strings.ui;
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [introError, setIntroError] = useState<string | null>(null);
  const triedIntro = React.useRef(false);

  const name = room.nombre_oficial || room.name || room.room_id;
  const intro = room.introduccion_narrativa || room.short_description || '';
  const label = getRoomLabel(room);

  const minutes = useMemo(() => {
    const stops = pieces.map((p, idx) => ({
      poi_id: p.piece_id,
      piece_id: p.piece_id,
      id: p.piece_id,
      title: p.titulo,
      room_zone: name,
      file: p.image_filename || '',
      map_coords: { x: p.map_x || 50, y: p.map_y || 50 },
      estimated_minutes: 5,
      room_id: room.room_id,
      ranking: idx + 1,
      piso: room.piso,
    }));
    return calculateRouteTimeMinutes(stops);
  }, [pieces, name, room]);

  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((playing, state) => {
      setIntroPlaying(playing && !state.pieceId && state.title === `${label}: ${name}`);
      // Si el teléfono no tiene voz para ese idioma, se avisa (si no, el botón no haría nada)
      if (triedIntro.current && state.errorMessage) setIntroError(state.errorMessage);
    });
    return () => {
      unsubscribe();
    };
  }, [label, name]);

  // Al salir de la sala se detiene la introducción (no el audio de una pieza)
  useEffect(() => () => {
    const s = ttsPlayer.getState();
    if (!s.pieceId) ttsPlayer.stop();
  }, [room.room_id]);

  const toggleIntro = () => {
    if (introPlaying) {
      ttsPlayer.stop();
      return;
    }
    setIntroError(null);
    ttsPlayer.clearErrorMessage();
    triedIntro.current = true;
    ttsPlayer.play(intro || room.frase_gancho || name, `${label}: ${name}`, () => setIntroPlaying(false), {
      roomName: `${label} · ${name}`,
      mode: 'inmersion',
      lang: roomScriptLanguage(room, currentLanguage),
    });
  };

  const first = pieces[0];

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar
        onBack={onBack}
        backLabel={backLabel}
        title={`${label} · ${name}`}
        revealAfter={150}
        right={<PassButton hasPass={hasPass} onClick={onOpenPaywall} />}
      />

      <section className="px-5 pt-6">
        <div className="font-serif text-[4.5rem] leading-[0.9] text-jade tabular-nums" aria-hidden="true">
          {getRoomShortLabel(room)}
        </div>
        <h1 className="mt-3 font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{name}</h1>
        <p className="mt-2 text-ui text-ink-3">
          {room.piso === 'PA' ? u.floors.PA : u.floors.PB}
          {' · '}
          {u.worksCount(pieces.length)}
          {minutes > 0 ? ` · ${formatRouteDuration(minutes)}` : ''}
        </p>
        {room.frase_gancho && (
          <p className="mt-4 font-serif italic text-[1.1875rem] leading-snug text-ink-2 text-pretty">{room.frase_gancho}</p>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {first && (
            <button type="button" id="btn-start-room" onClick={() => onSelectPiece(first.piece_id)} className="btn-primary w-full">
              <Play className="w-5 h-5 fill-current" />
              {u.room.start}
            </button>
          )}
          <button type="button" id="btn-room-intro" onClick={toggleIntro} className="btn-secondary w-full">
            {introPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {introPlaying ? u.room.stopIntro : u.room.listenIntro}
          </button>
          {introError && (
            <div role="alert" className="p-3.5 pr-1.5 rounded-2xl bg-raised border border-tezontle/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-tezontle shrink-0 mt-0.5" />
              <p className="flex-1 text-ui leading-snug">{introError}</p>
              <button
                type="button"
                onClick={() => {
                  setIntroError(null);
                  ttsPlayer.clearErrorMessage();
                }}
                aria-label={strings.piece.closeNotice}
                className="btn-icon -my-2 text-ink-3 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {intro && (
          <div className="mt-6">
            <p className={`text-[1.0625rem] leading-relaxed text-ink-2 ${introOpen ? '' : 'line-clamp-3'}`}>{intro}</p>
            {intro.length > 160 && (
              <button
                type="button"
                onClick={() => setIntroOpen((v) => !v)}
                aria-expanded={introOpen}
                className="mt-1 h-10 inline-flex items-center gap-1 text-ui font-semibold text-jade cursor-pointer"
              >
                {introOpen ? u.readLess : u.readMore}
                <ChevronDown className={`w-4 h-4 transition-transform ${introOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="room-works-title">
        <h2 id="room-works-title" className="px-5 font-serif text-h3 font-medium">
          {u.room.works}
        </h2>
        <ol className="mt-3" id="room-pieces-list">
          {pieces.map((p, i) => {
            const locked = !p.is_free && !hasPass;
            const here = currentPieceId === p.piece_id;
            return (
              <li key={p.piece_id}>
                <button
                  type="button"
                  onClick={() => onSelectPiece(p.piece_id)}
                  aria-current={here ? 'true' : undefined}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-left cursor-pointer row-press ${here ? 'bg-surface' : ''}`}
                >
                  <span className={`w-6 shrink-0 text-right font-serif text-[1.125rem] tabular-nums ${here ? 'text-jade' : 'text-ink-3'}`}>
                    {i + 1}
                  </span>
                  <span className="w-16 h-16 rounded-xl overflow-hidden bg-raised shrink-0">
                    <PieceImage filename={p.image_filename} pieceId={p.piece_id} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.0625rem] font-bold leading-snug text-ink">{p.titulo}</span>
                    {p.frase_gancho && <span className="block text-cap text-ink-3 mt-0.5 line-clamp-2">{p.frase_gancho}</span>}
                    {here && <span className="block text-cap font-semibold text-jade mt-1">{u.room.youAreHere}</span>}
                  </span>
                  {locked ? (
                    <Lock className="w-4 h-4 text-oro shrink-0" aria-label={u.lockedAria} />
                  ) : (
                    !hasPass && <span className="text-[12px] font-semibold text-jade shrink-0">{u.free}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};

export default RoomView;

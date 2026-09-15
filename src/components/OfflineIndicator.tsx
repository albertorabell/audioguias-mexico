import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600/95 px-3.5 py-1.5 text-xs font-semibold text-stone-950 shadow-lg backdrop-blur-xs border border-amber-400/40 animate-pulse"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo Offline activo — Guías cacheadas</span>
    </div>
  );
};

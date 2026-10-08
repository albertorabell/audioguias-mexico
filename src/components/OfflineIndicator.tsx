import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { useStrings } from '../utils/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const t = useStrings().chrome.offline;

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-raised px-3.5 py-1.5 text-cap font-semibold text-ink shadow-lg shadow-black/30 border border-line-strong pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>{t.banner}</span>
    </div>
  );
};

import React from 'react';
import { Landmark, Compass, Map as MapIcon, Search } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';
import { useStrings } from '../utils/LanguageContext';

export type DockTab = 'salas' | 'recorridos' | 'mapa' | 'teclado';

interface BottomDockBarProps {
  activeTab: DockTab;
  onSelectTab: (tab: DockTab) => void;
  roomsCount?: number;
  className?: string;
}

export const BottomDockBar: React.FC<BottomDockBarProps> = ({
  activeTab,
  onSelectTab,
  roomsCount,
  className = '',
}) => {
  const { isSunMode } = useTheme();
  const t = useStrings().chrome.dock;

  const tabs = [
    {
      id: 'salas' as DockTab,
      label: t.rooms,
      icon: Landmark,
      badge: roomsCount ? String(roomsCount) : undefined,
      hint: t.roomsHint,
    },
    {
      id: 'recorridos' as DockTab,
      label: t.route,
      icon: Compass,
      hint: t.routeHint,
    },
    {
      id: 'mapa' as DockTab,
      label: t.map,
      icon: MapIcon,
      hint: t.mapHint,
    },
    {
      id: 'teclado' as DockTab,
      label: t.search,
      icon: Search,
      hint: t.searchHint,
    },
  ];

  return (
    <nav
      id="museum-dock-bar"
      aria-label={t.navAria}
      className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t transition-colors duration-200 ${
        isSunMode
          ? 'bg-white/95 border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]'
          : 'bg-black/90 border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]'
      } ${className}`}
    >
      <div className="max-w-[480px] mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`dock-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-13 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? isSunMode
                    ? 'text-amber-700 font-extrabold'
                    : 'text-amber-400 font-extrabold'
                  : isSunMode
                  ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 font-semibold'
              }`}
              title={tab.hint}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-black leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>

              {/* Indicator dot */}
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomDockBar;

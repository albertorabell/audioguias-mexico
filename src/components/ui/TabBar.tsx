import React from 'react';
import { Landmark, Route as RouteIcon, Map as MapIcon, Search } from 'lucide-react';
import { useStrings } from '../../utils/LanguageContext';

/** Las cuatro pestañas de un museo. Los ids (dock-tab-…) los usan las pruebas. */
export type DockTab = 'salas' | 'recorridos' | 'mapa' | 'teclado';

interface TabBarProps {
  activeTab: DockTab | null;
  onSelectTab: (tab: DockTab) => void;
  /** Muestra un punto en "Recorridos" cuando hay un recorrido en curso. */
  tourActive?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab, tourActive }) => {
  const t = useStrings().ui.tabs;
  const tabs: { id: DockTab; label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'salas', label: t.museum, Icon: Landmark },
    { id: 'recorridos', label: t.routes, Icon: RouteIcon },
    { id: 'mapa', label: t.map, Icon: MapIcon },
    { id: 'teclado', label: t.search, Icon: Search },
  ];

  return (
    <nav
      id="museum-dock-bar"
      aria-label={t.aria}
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-bg/94 backdrop-blur-xl border-t border-line"
    >
      <div className="max-w-[480px] mx-auto grid grid-cols-4 h-16">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              id={`dock-tab-${id}`}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                active ? 'text-jade' : 'text-ink-3 active:text-ink'
              }`}
            >
              {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-jade" aria-hidden="true" />}
              <span className="relative">
                <Icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.8} />
                {id === 'recorridos' && tourActive && (
                  <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-jade ring-2 ring-bg" aria-hidden="true" />
                )}
              </span>
              <span className={`text-[12px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;

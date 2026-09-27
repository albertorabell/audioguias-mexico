import React from 'react';
import { Landmark, Compass, Map as MapIcon, Search } from 'lucide-react';

export type DockTab = 'salas' | 'recorridos' | 'mapa' | 'teclado';

interface BottomDockBarProps {
  activeTab: DockTab;
  onSelectTab: (tab: DockTab) => void;
  className?: string;
}

export const BottomDockBar: React.FC<BottomDockBarProps> = ({
  activeTab,
  onSelectTab,
  className = '',
}) => {
  const tabs = [
    {
      id: 'salas' as DockTab,
      label: 'Salas',
      icon: Landmark,
      badge: '22',
      hint: 'Explorador PB y PA',
    },
    {
      id: 'recorridos' as DockTab,
      label: 'Rutas',
      icon: Compass,
      hint: 'Asistente y rutas temáticas',
    },
    {
      id: 'mapa' as DockTab,
      label: 'Mapa',
      icon: MapIcon,
      hint: 'Plano interactivo',
    },
    {
      id: 'teclado' as DockTab,
      label: '🔢 Vitrina',
      icon: Search,
      hint: 'Número de vitrina o título',
    },
  ];

  return (
    <nav
      id="museum-dock-bar"
      aria-label="Navegación principal de una sola mano"
      className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/85 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] ${className}`}
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
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] h-full flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer group active:scale-95 ${
                isActive
                  ? 'text-[#F59E0B]'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              {/* Indicador de activo superior suave */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
              )}

              {/* Contenedor de Icono con microescala */}
              <div
                className={`relative flex items-center justify-center transition-transform duration-200 ${
                  isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'stroke-[2.4px] text-[#F59E0B]' : 'stroke-[1.8px]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-black leading-none rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Etiqueta de texto */}
              <span
                className={`text-[10px] tracking-tight mt-1 transition-all ${
                  isActive
                    ? 'font-bold text-[#F3F4F6]'
                    : 'font-medium text-[#9CA3AF]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomDockBar;

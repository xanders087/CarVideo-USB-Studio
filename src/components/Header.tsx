import React from 'react';
import { Disc3, Car, HardDrive, PlusCircle, Wrench, Sun, Moon } from 'lucide-react';

export type AppTab = 'add' | 'usb' | 'car';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  usbCount: number;
  onOpenRepairTool: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  usbCount,
  onOpenRepairTool,
  theme,
  onToggleTheme,
}) => {
  const navItems: {
    id: AppTab;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'add',
      label: '1. Añadir videos',
      mobileLabel: '1. Añadir',
      icon: <PlusCircle className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'usb',
      label: '2. Mi USB',
      mobileLabel: '2. Mi USB',
      icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
      badge: usbCount > 0 ? usbCount : undefined,
    },
    {
      id: 'car',
      label: '3. Probar en el auto',
      mobileLabel: '3. Auto',
      icon: <Car className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Disc3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white font-display block leading-tight">
              CarVideo USB Studio
            </span>
            <span className="text-[11px] text-slate-400 hidden lg:block">
              Videos MP4 (H.264 + AAC) listos para pantallas de vehículo
            </span>
          </div>
        </button>

        {/* Zone 2: 3-Step Workflow Navigation (Desktop) */}
        <nav aria-label="Flujo principal" className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/70 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-emerald-500 text-slate-950 text-[11px] px-1.5 py-0.5 rounded-full font-mono font-bold tabular-nums leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Repair Tool & Theme */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenRepairTool}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 transition-colors"
            title="Reparar videos mudos o con audio incompatible (1 clic)"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reparar audio</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 transition-colors"
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span className="hidden sm:inline">Oscuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile 3-Step Bar */}
      <nav
        aria-label="Flujo principal móvil"
        className="md:hidden grid grid-cols-3 border-t border-slate-800/80 bg-slate-950/95"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.mobileLabel}</span>
              {item.badge !== undefined && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

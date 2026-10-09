import React from 'react';
import { Disc3, Car, HardDrive, ShieldCheck, Download, Layers, Globe, Wrench, Sun, Moon } from 'lucide-react';

export type AppTab = 'web-downloader' | 'staging' | 'car-mode' | 'usb-manager' | 'licenses';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  videoCount: number;
  stagingCount: number;
  onQuickExport: () => void;
  onOpenTroubleshooter?: () => void;
  onOpenRepairTool?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  videoCount,
  stagingCount,
  onQuickExport,
  onOpenTroubleshooter,
  onOpenRepairTool,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('web-downloader')} 
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Disc3 className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-display block leading-tight">
                CarVideo USB Studio
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Optimizador de Videos MP4 con Audio para Pantallas de Vehículos
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('web-downloader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'web-downloader'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Descargas Web</span>
          </button>

          <button
            onClick={() => setActiveTab('staging')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'staging'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Cola USB</span>
            {stagingCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {stagingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('car-mode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'car-mode'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Car className="w-4 h-4 text-amber-400" />
            <span>Consola de Auto</span>
          </button>

          <button
            onClick={() => setActiveTab('usb-manager')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'usb-manager'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Gestor USB</span>
          </button>

          <button
            onClick={() => setActiveTab('licenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'licenses'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Marco Legal</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-lg border transition-all shadow-sm ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700/80 hover:border-slate-600'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'
            }`}
            title={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
                <span className="hidden sm:inline text-slate-300">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600 transition-transform group-hover:-rotate-12" />
                <span className="hidden sm:inline text-slate-700">Oscuro</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('web-downloader')}
            className="md:hidden p-2 rounded-lg bg-slate-900 text-cyan-400 border border-slate-800"
            title="Descargas Web"
          >
            <Globe className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('car-mode')}
            className="md:hidden p-2 rounded-lg bg-slate-900 text-amber-400 border border-slate-800"
            title="Consola de Auto"
          >
            <Car className="w-5 h-5" />
          </button>

          {onOpenRepairTool && (
            <button
              onClick={onOpenRepairTool}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 transition-colors shadow-sm"
              title="Herramienta Reparadora de Videos Mudos o Incompatibles (1-Clic)"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reparar Audio (1-Clic)</span>
            </button>
          )}

          <button
            onClick={onQuickExport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm shadow-cyan-500/20 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar a USB</span>
            <span className="sm:hidden">USB</span>
            <span className="bg-slate-950 text-cyan-400 text-[11px] px-1.5 py-0.2 rounded font-mono tabular-nums">
              {stagingCount > 0 ? stagingCount : videoCount}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};

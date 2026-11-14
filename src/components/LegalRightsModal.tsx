import React from 'react';
import { ShieldCheck, Scale, ExternalLink, BookOpen, Car, X } from 'lucide-react';

interface LegalRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalRightsModal: React.FC<LegalRightsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Marco Legal y Copia Privada
              </h2>
              <p className="text-xs text-slate-400">
                Uso personal y licencias abiertas para memorias USB en vehículos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar Marco Legal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">1. Creative Commons</h3>
              <p className="text-slate-400 leading-relaxed">
                Obras compartidas gratuitamente por sus autores solicitando únicamente atribución de autoría.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <Car className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">2. Copia Privada</h3>
              <p className="text-slate-400 leading-relaxed">
                Almacenamiento en USB para disfrute personal y familiar dentro de tu automóvil, sin ánimo de lucro.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">3. Dominio Público</h3>
              <p className="text-slate-400 leading-relaxed">
                Contenido libre de regalías o preservación histórica como los archivos de Internet Archive.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h4 className="font-bold text-white text-sm">
              ¿Por qué la app usa MP4 (H.264 + AAC) y nombres limpios?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Las pantallas automotrices (Pioneer, Sony, Alpine, Android Auto y sistemas OEM) usan decodificadores por hardware H.264 + AAC sobre USB formateadas en FAT32/exFAT. Mantener ese perfil evita pantallas negras, archivos mudos y bloqueos de lectura.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Fuentes legales recomendadas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'Internet Archive (Video)', url: 'https://archive.org/details/movies' },
                { name: 'NoCopyrightSounds (NCS)', url: 'https://www.youtube.com/c/NoCopyrightSounds' },
                { name: 'Free Music Archive', url: 'https://freemusicarchive.org/' },
                { name: 'Creative Commons', url: 'https://creativecommons.org/' },
              ].map((src) => (
                <a
                  key={src.name}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>{src.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

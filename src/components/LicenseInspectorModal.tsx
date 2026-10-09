import React from 'react';
import { ShieldCheck, X, ExternalLink, CheckCircle2, AlertCircle, Scale, FileText, Info } from 'lucide-react';
import { CarVideoItem } from '../types/media';

interface LicenseInspectorModalProps {
  video: CarVideoItem | null;
  onClose: () => void;
}

export const LicenseInspectorModal: React.FC<LicenseInspectorModalProps> = ({
  video,
  onClose
}) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Verificación de Derechos y Licencia
              </h3>
              <p className="text-xs text-slate-400">
                Garantía de uso legal para pantallas y estéreos vehiculares
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Target Track Details */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-cyan-400 font-mono block uppercase">Obra Musical</span>
            <div className="text-sm font-bold text-white">{video.title}</div>
            <div className="text-xs text-slate-400">Artista / Canal: {video.artist}</div>
          </div>

          {/* License Status Card */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{video.license.type}</span>
              </span>
              <span className="text-[11px] font-mono bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded">
                Uso Vehicular Autorizado
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {video.license.attribution}
            </p>

            {video.license.sourceUrl && (
              <a
                href={video.license.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1 font-mono"
              >
                <span>Ver términos oficiales de la licencia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Vehicle Legal Framework */}
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Marco Legal: Copia Privada y Reproducción en Automóviles</span>
            </h4>
            <p className="text-slate-400 leading-relaxed">
              El almacenamiento de copias digitales de música y video en soportes físicos (como memorias flash USB) para el disfrute personal de ti y tus acompañantes dentro de un vehículo automotor está amparado bajo las normativas de <strong>copia privada y uso doméstico o particular</strong>.
            </p>
          </div>

          {/* Permitted vs Prohibited Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            <div className="p-3 bg-slate-950 border border-emerald-900/50 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Permitido:</span>
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                <li>Reproducir en estéreos o pantallas del auto.</li>
                <li>Llevar en tu memoria USB para viajes familiares o trayectos diarios.</li>
                <li>Preservar los créditos y nombres de los artistas en los archivos.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 border border-red-900/40 rounded-xl space-y-1.5">
              <span className="text-red-400 font-bold block flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>No Permitido:</span>
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                <li>Venta o alquiler de memorias USB con música.</li>
                <li>Uso comercial en transporte público con cobro de entrada.</li>
                <li>Eliminar las licencias de autor originales.</li>
              </ul>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Entendido y Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};

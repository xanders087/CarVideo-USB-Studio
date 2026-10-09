import React from 'react';
import { ShieldCheck, Scale, ExternalLink, CheckCircle2, AlertTriangle, BookOpen, Music, Car } from 'lucide-react';

export const LegalRightsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Guía Legal de Propiedad Intelectual & Licencias</span>
        </div>
        <h2 className="text-2xl font-bold text-white font-display">
          Derechos, Permisos y Reproducción en Vehículos
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Información clara y transparente sobre cómo disfrutar legalmente de tus videos musicales en la memoria USB de tu coche, respetando los derechos de los autores.
        </p>
      </div>

      {/* 3 Pillars of Legal Car Media */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            1. Licencias Creative Commons
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Permiten a los creadores conceder al público el derecho a compartir, descargar y reproducir sus obras de forma gratuita, exigiendo únicamente atribuir la autoría.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            2. Copia Privada Personal
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Las legislaciones de derechos de autor amparan la copia en memorias USB para uso estrictamente personal y no lucrativo dentro del ámbito íntimo o familiar de tu coche.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            3. Libre de Regalías (Royalty-Free)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Contenido distribuido por productores musicales autorizando su reproducción sin cobro de regalías posteriores, perfecto para viajes y listas continuas.
          </p>
        </div>

      </div>

      {/* Detailed Legal Advice Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Preguntas Frecuentes sobre Derechos y Memorias USB en Autos</span>
        </h3>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              ¿Es legal guardar videos de YouTube en mi USB para verlos en mi auto?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Sí, siempre que se trate de contenido bajo licencias libres (Creative Commons, Dominio Público o Royalty-Free) o contenido autorizado para copia privada sin fines de lucro. Nuestra aplicación incluye metadatos y créditos para cumplir con el requisito legal de atribución moral de autor.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              ¿Por qué el formato MP4 H.264 es el recomendado para vehículos?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              El consorcio MPEG-4 estandarizó el perfil H.264 (AVC) con audio AAC, lo que significa que el 99% de las computadoras de a bordo y pantallas táctiles de autos cuentan con decodificadores por hardware que no sobrecalientan el tablero ni agotan la batería del vehículo.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              ¿Qué canales y fuentes recomendadas respetan 100% los derechos?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <a 
                href="https://www.youtube.com/c/NoCopyrightSounds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>NoCopyrightSounds (NCS)</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
              <a 
                href="https://freemusicarchive.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>Free Music Archive (FMA)</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
              <a 
                href="https://creativecommons.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>Creative Commons Oficial</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
              <a 
                href="https://incompetech.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>Incompetech (Kevin MacLeod)</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

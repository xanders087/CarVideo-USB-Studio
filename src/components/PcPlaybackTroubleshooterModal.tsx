import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Monitor, 
  Car, 
  Download, 
  HardDrive, 
  Play, 
  ShieldAlert, 
  FileCode2, 
  ExternalLink,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { generateFolderRepairBat } from '../services/videoMetadataVerifier';

interface PcPlaybackTroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PcPlaybackTroubleshooterModal: React.FC<PcPlaybackTroubleshooterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [downloadingTest, setDownloadingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTestVideo = async () => {
    setDownloadingTest(true);
    try {
      const res = await fetch('/videos/test.mp4');
      if (!res.ok) throw new Error('Error al obtener video de prueba');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Test_Compatibilidad_PC_y_Auto_FastStart(720p).mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 4000);
    } catch {
      window.location.href = '/api/download/video?file=test.mp4&title=Test_Compatibilidad_PC_y_Auto.mp4';
    } finally {
      setDownloadingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                Diagnóstico de Reproducción en PC y Auto
              </h2>
              <p className="text-xs text-slate-400">
                ¿Por qué un video sale con pantalla negra, código 0xc00d36c4 o no reproduce?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          
          {/* Main Direct Answer Banner */}
          <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Causas Principales del Error en tu Computadora</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Si al dar doble clic en tu PC el archivo no abre y muestra un mensaje como <em>&quot;No se puede reproducir (0xc00d36c4)&quot;</em> o una pantalla negra con advertencia, las causas habituales son:
            </p>
          </div>

          {/* Detailed Diagnosis Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Cause 1 */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <FileCode2 className="w-4 h-4" />
                <span>1. Archivo .url o .m3u</span>
              </div>
              <p className="text-xs text-slate-400">
                Windows a menudo oculta extensiones de archivo. Si intentas reproducir el acceso directo <strong className="text-slate-200">.url</strong> o la lista de reproducción <strong className="text-slate-200">.m3u</strong> en vez del archivo de video <strong className="text-slate-200">.mp4</strong>, Windows Media Player marcará error de archivo incompatible.
              </p>
            </div>

            {/* Cause 2 */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>2. Reproductor de Windows</span>
              </div>
              <p className="text-xs text-slate-400">
                La aplicación nativa de Windows <em>&quot;Películas y TV&quot;</em> requiere códecs específicos y rechaza archivos que no tengan el átomo <strong className="text-slate-200">FastStart (moov atom)</strong> al principio del archivo.
              </p>
            </div>

            {/* Cause 3 */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                <Car className="w-4 h-4" />
                <span>3. Protección de YouTube</span>
              </div>
              <p className="text-xs text-slate-400">
                Los videos oficiales de YouTube están cifrados y protegidos por derechos de autor (TOS de Google). Los navegadores no pueden descargar el archivo MP4 comercial sin restricciones directamente sin emular un flujo vehicular.
              </p>
            </div>
          </div>

          {/* Practical Step-by-Step Solutions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Soluciones Rápidas para Reproducir tus Videos</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Usa VLC Media Player en tu PC</strong>
                  <span className="text-slate-400">
                    VLC es 100% gratuito, de código abierto y no depende de los códecs restrictivos de Windows. Puede reproducir cualquier archivo MP4, MKV o AVI sin importar cómo se haya descargado.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Descomprime el archivo .ZIP antes de copiar a la USB</strong>
                  <span className="text-slate-400">
                    No reproduzcas los videos dentro del archivo comprimido. Haz clic derecho en el archivo .ZIP descargado, selecciona <em>&quot;Extraer todo...&quot;</em> y copia las carpetas resultantes a la raíz de tu memoria USB (formateada en FAT32).
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Descarga usando el botón &quot;Bajar MP4&quot; individual</strong>
                  <span className="text-slate-400">
                    Hemos actualizado el sistema de descarga para que entregue directamente un archivo binario MP4 con cabeceras FastStart y audio estéreo compatible tanto con la pantalla de tu auto como con Windows Media Player.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-amber-900/60 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-amber-300 block mb-0.5">¿El video se reproduce pero NO tiene audio (mudo o archivo .f133)?</strong>
                  <span className="text-slate-400 block mb-2">
                    YouTube separa el video del audio en formatos DASH (.f133 es video sin sonido). Para fusionarlos se necesita <strong className="text-white">FFmpeg</strong>. Puedes descargar el <strong className="text-cyan-300">Reparador de Carpeta en 1 Clic (.bat)</strong>: descarga FFmpeg automáticamente en tu PC y repara toda tu carpeta de videos con audio AAC estéreo sin pérdida de calidad.
                  </span>
                  <button
                    onClick={() => {
                      const bat = generateFolderRepairBat();
                      const blob = new Blob([bat], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'Reparar_Videos_Auto.bat';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Reparador de Carpeta (.bat) 1-Clic</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Video Download Action */}
          <div className="p-4 bg-gradient-to-r from-slate-950 to-cyan-950/40 border border-cyan-800/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                <span>Descargar Video de Prueba de Compatibilidad</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Archivo MP4 720p H.264 Main Profile con audio estéreo AAC 44.1kHz y átomo FastStart al frente.
              </p>
            </div>

            <button
              onClick={handleDownloadTestVideo}
              disabled={downloadingTest}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 active:scale-95"
            >
              {downloadingTest ? (
                <span>Descargando...</span>
              ) : testSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>¡Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Descargar Test MP4</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Formato automotriz optimizado: FAT32 · H.264 · AAC Estéreo</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

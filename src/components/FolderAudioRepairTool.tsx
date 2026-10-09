import React, { useState } from 'react';
import { 
  Wrench, 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  FolderPlus, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode2, 
  Volume2, 
  HelpCircle,
  HardDrive,
  X,
  Play,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  generateFolderRepairBat, 
  generateFolderRepairSh, 
  FolderRepairScriptOptions 
} from '../services/videoMetadataVerifier';

interface FolderAudioRepairToolProps {
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToDropzone?: () => void;
}

export const FolderAudioRepairTool: React.FC<FolderAudioRepairToolProps> = ({
  isModal = false,
  onClose,
  onNavigateToDropzone
}) => {
  const [outputFolder, setOutputFolder] = useState('Reparados_Para_Auto');
  const [audioBitrate, setAudioBitrate] = useState<'192k' | '256k' | '320k'>('192k');
  const [sampleRate, setSampleRate] = useState<48000 | 44100>(48000);
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'command'>('windows');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const scriptOptions: FolderRepairScriptOptions = {
    outputFolder,
    audioBitrate,
    sampleRate
  };

  const windowsBatContent = generateFolderRepairBat(scriptOptions);
  const macShContent = generateFolderRepairSh(scriptOptions);
  const singleLineCommand = `for %i in (*.mp4 *.webm *.mkv) do ffmpeg -i "%i" -c:v copy -c:a aac -b:a ${audioBitrate} -ar ${sampleRate} -movflags +faststart "${outputFolder}\\%~ni.mp4"`;

  const downloadScriptFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNoticeMessage(`¡Script "${filename}" descargado con éxito! Guárdalo en la carpeta de tus videos y haz doble clic.`);
    setTimeout(() => setNoticeMessage(null), 5500);
  };

  const copyToClipboard = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const content = (
    <div className="space-y-6">
      
      {/* Notice Message */}
      {noticeMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button 
            onClick={() => setNoticeMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="p-6 bg-slate-900 border border-cyan-800/60 rounded-xl relative overflow-hidden shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>Solución Integral Automatizada</span>
          <span aria-hidden="true">·</span>
          <span>Instalación de FFmpeg Garantizada</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display mb-2">
          Generador del Script Reparador de Carpetas (1-Clic)
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          ¿Tienes videos descargados que se reproducen sin audio o muestran error por códec Opus/Vorbis? 
          No necesitas ejecutar comandos complicados uno por uno. Este script portable 
          <strong className="text-cyan-300"> instala automáticamente FFmpeg si no está en tu PC</strong> y 
          repara toda tu carpeta de videos en un solo clic, multiplexando pistas de audio separadas y recodificando a 
          <strong className="text-white"> AAC Estéreo universal para auto</strong> con velocidad ultra rápida (sin re-codificar el video).
        </p>

        {/* Feature badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">FFmpeg Portable</span>
              <span className="text-[11px] text-slate-400">Instalación 100% garantizada</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">AAC Estéreo 48kHz</span>
              <span className="text-[11px] text-slate-400">Sonido en 99.9% de estéreos</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Multiplexación Automática</span>
              <span className="text-[11px] text-slate-400">Une video + audio .m4a/.opus</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Cero Pérdida de Imagen</span>
              <span className="text-[11px] text-slate-400">Copia H.264 instantánea</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Simple Steps Workflow */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Cómo funciona en 3 sencillos pasos (Sin conocimientos técnicos)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 font-mono text-[11px]">
              1
            </div>
            <h4 className="font-semibold text-white">Descarga el Script de 1 Clic</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Haz clic en el botón verde inferior para descargar <code>Reparar_Videos_Auto.bat</code> (Windows) o <code>.sh</code> (Mac).
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 font-mono text-[11px]">
              2
            </div>
            <h4 className="font-semibold text-white">Muévelo a la Carpeta de tus Videos</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Copia o arrastra el archivo descargado a la carpeta donde tienes tus videos descargados o directamente dentro de tu memoria USB.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 font-mono text-[11px]">
              3
            </div>
            <h4 className="font-semibold text-white">Doble Clic y ¡Listo!</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              El script detectará si tienes FFmpeg, lo configurará en silencio y creará una carpeta limpia <code>/Reparados_Para_Auto</code> con todo funcionando.
            </p>
          </div>
        </div>
      </div>

      {/* Script Options Panel */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Configuración del Reparador</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Valores optimizados para pantallas Pioneer, Sony, Alpine y consolas Android
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Output folder */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nombre de Carpeta Destino</span>
            </label>
            <input
              type="text"
              value={outputFolder}
              onChange={(e) => setOutputFolder(e.target.value.replace(/[\\/:*?"<>|]/g, ''))}
              placeholder="Reparados_Para_Auto"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Se creará automáticamente dentro de la carpeta actual
            </span>
          </div>

          {/* Audio Bitrate */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bitrate de Audio AAC</span>
            </label>
            <select
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="192k">192 kbps (Recomendado estándar para auto)</option>
              <option value="256k">256 kbps (Alta fidelidad acústica)</option>
              <option value="320k">320 kbps (Máxima calidad de estudio)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              192 kbps ofrece el mejor balance entre nitidez y compatibilidad
            </span>
          </div>

          {/* Sample Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Frecuencia de Muestreo</span>
            </label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(Number(e.target.value) as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value={48000}>48,000 Hz (Estándar de video para vehículos)</option>
              <option value={44100}>44,100 Hz (Estándar de CD de audio)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              48 kHz previene desincronizaciones de audio/video
            </span>
          </div>
        </div>
      </div>

      {/* Main 1-Click Action Bar */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Descarga Directa en 1 Clic (Listo para usar)</span>
          </div>
          <p className="text-xs text-slate-300">
            El archivo generado contiene la lógica completa para instalar FFmpeg y procesar todos los videos de la carpeta.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => downloadScriptFile(windowsBatContent, 'Reparar_Videos_Auto.bat')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Reparador (.bat) Windows</span>
          </button>

          <button
            onClick={() => downloadScriptFile(macShContent, 'Reparar_Videos_Auto.sh')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Descargar (.sh) Mac / Linux</span>
          </button>
        </div>
      </div>

      {/* Live Script Code Viewer */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Segmented OS tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('windows')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'windows'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Windows (.bat)
            </button>
            <button
              onClick={() => setActiveTab('mac')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'mac'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              macOS / Linux (.sh)
            </button>
            <button
              onClick={() => setActiveTab('command')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'command'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comando de 1 Línea
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={() => {
              if (activeTab === 'windows') copyToClipboard(windowsBatContent, 'bat');
              else if (activeTab === 'mac') copyToClipboard(macShContent, 'sh');
              else copyToClipboard(singleLineCommand, 'cmd');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
          >
            {copiedType ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code display */}
        <div className="relative">
          <pre className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed">
            {activeTab === 'windows' && windowsBatContent}
            {activeTab === 'mac' && macShContent}
            {activeTab === 'command' && singleLineCommand}
          </pre>
        </div>
      </div>

      {/* Navigation link to Dropzone test */}
      {onNavigateToDropzone && (
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>¿Ya reparaste tus videos? Pruébalos en el simulador de cabina del vehículo.</span>
          </div>
          <button
            onClick={onNavigateToDropzone}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>Ir al Verificador / Importar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div 
          className="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Reparador Automático de Carpetas de Video
                </h2>
                <p className="text-xs text-slate-400">
                  Solución de 1 clic para videos mudos o códecs de audio incompatibles
                </p>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {content}
        </div>
      </div>
    );
  }

  return content;
};

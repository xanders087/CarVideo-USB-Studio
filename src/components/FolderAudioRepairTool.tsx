import React, { useRef, useState } from 'react';
import {
  Wrench,
  Download,
  Copy,
  Check,
  X,
  FolderPlus,
  Volume2,
  Sliders,
} from 'lucide-react';
import {
  generateFolderRepairBat,
  generateFolderRepairSh,
  FolderRepairScriptOptions,
} from '../services/videoMetadataVerifier';
import { downloadBlob, useClipboard, useModalDialog, useNotice } from '../utils/mediaHelpers';
import { NoticeBanner } from './NoticeBanner';

interface FolderAudioRepairToolProps {
  isOpen: boolean;
  onClose: () => void;
}

type RepairTab = 'windows' | 'mac' | 'command';

const REPAIR_TAB_LABELS: Record<RepairTab, string> = {
  windows: 'Windows (.bat)',
  mac: 'Mac / Linux (.sh)',
  command: 'Comando 1 línea',
};

export const FolderAudioRepairTool: React.FC<FolderAudioRepairToolProps> = ({
  isOpen,
  onClose,
}) => {
  const [outputFolder, setOutputFolder] = useState('Reparados_Para_Auto');
  const [audioBitrate, setAudioBitrate] = useState<'192k' | '256k' | '320k'>('192k');
  const [sampleRate, setSampleRate] = useState<48000 | 44100>(48000);
  const [activeTab, setActiveTab] = useState<RepairTab>('windows');
  const [showCode, setShowCode] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(isOpen, onClose, panelRef);

  const { copiedKey, copy } = useClipboard();
  const { notice, showNotice, clearNotice } = useNotice(5000);

  if (!isOpen) return null;

  const safeFolderName = (outputFolder || 'Reparados_Para_Auto').replace(/[^\w-]/g, '_') || 'Reparados_Para_Auto';
  const scriptOptions: FolderRepairScriptOptions = {
    outputFolder: safeFolderName,
    audioBitrate,
    sampleRate,
  };

  const windowsBatContent = generateFolderRepairBat(scriptOptions);
  const macShContent = generateFolderRepairSh(scriptOptions);
  const singleLineCommand = String.raw`for %i in (*.mp4 *.webm *.mkv) do ffmpeg -i "%i" -c:v copy -c:a aac -b:a ${audioBitrate} -ar ${sampleRate} -movflags +faststart "${safeFolderName}\%~ni.mp4"`;

  const scriptByTab: Record<RepairTab, string> = {
    windows: windowsBatContent,
    mac: macShContent,
    command: singleLineCommand,
  };

  const handleDownload = (content: string, filename: string) => {
    downloadBlob(content, filename);
    showNotice(
      `Script "${filename}" descargado. Ponlo en la carpeta de tus videos y haz doble clic.`,
      'success'
    );
  };

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby="folder-repair-modal-title"
      className="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none bg-transparent border-0 p-4 flex items-center justify-center"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar reparador"
        onClick={onClose}
        className="fixed inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm border-0 p-0 cursor-default"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl focus:outline-none"
      >
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="folder-repair-modal-title"
                className="text-base sm:text-lg font-bold text-white font-display"
              >
                Reparar Audio de una Carpeta (1-Clic)
              </h2>
              <p className="text-xs text-slate-400">
                Convierte videos mudos (.f133) o con códec Opus/Vorbis a MP4 H.264 + AAC Estéreo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar reparador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          <NoticeBanner notice={notice} onDismiss={clearNotice} />

          {/* Simple 3-step explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="font-mono text-cyan-400 font-bold">1. Descarga</span>
              <p className="text-slate-300 mt-1">Elige el script para Windows (.bat) o Mac/Linux (.sh).</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="font-mono text-cyan-400 font-bold">2. Muévelo</span>
              <p className="text-slate-300 mt-1">Pega el archivo en la carpeta donde tienes tus videos.</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="font-mono text-emerald-400 font-bold">3. Doble clic</span>
              <p className="text-slate-300 mt-1">
                Instala FFmpeg si falta y guarda todo listo en <code className="text-cyan-300">/{safeFolderName}</code>.
              </p>
            </div>
          </div>

          {/* Compact Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div>
              <label
                htmlFor="repair-output-folder"
                className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Carpeta destino</span>
              </label>
              <input
                id="repair-output-folder"
                type="text"
                value={outputFolder}
                onChange={(e) => setOutputFolder(e.target.value.replace(/[^\w-]/g, '_'))}
                placeholder="Reparados_Para_Auto"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="repair-audio-bitrate"
                className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Calidad de audio AAC</span>
              </label>
              <select
                id="repair-audio-bitrate"
                value={audioBitrate}
                onChange={(e) => setAudioBitrate(e.target.value as '192k' | '256k' | '320k')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="192k">192 kbps (Estándar auto)</option>
                <option value="256k">256 kbps (Alta fidelidad)</option>
                <option value="320k">320 kbps (Máxima)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="repair-sample-rate"
                className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Muestreo</span>
              </label>
              <select
                id="repair-sample-rate"
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value) as 48000 | 44100)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={48000}>48,000 Hz (Video auto)</option>
                <option value={44100}>44,100 Hz (CD audio)</option>
              </select>
            </div>
          </div>

          {/* Primary Download Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownload(windowsBatContent, 'Reparar_Videos_Auto.bat')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Reparador Windows (.bat)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload(macShContent, 'Reparar_Videos_Auto.sh')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Descargar Mac / Linux (.sh)</span>
            </button>
          </div>

          {/* Optional Advanced Code View */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/70">
              <button
                type="button"
                onClick={() => setShowCode((s) => !s)}
                className="text-slate-300 hover:text-white font-semibold"
              >
                {showCode ? 'Ocultar código / comando manual' : 'Ver código o comando de terminal'}
              </button>

              <button
                type="button"
                onClick={() => void copy(scriptByTab[activeTab], activeTab)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {showCode && (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  {(['windows', 'mac', 'command'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                        activeTab === tab
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {REPAIR_TAB_LABELS[tab]}
                    </button>
                  ))}
                </div>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56">
                  {scriptByTab[activeTab]}
                </pre>
              </div>
            )}
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
    </dialog>
  );
};

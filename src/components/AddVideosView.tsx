import React, { useState, useRef } from 'react';
import {
  Youtube,
  Globe,
  Upload,
  Search,
  Download,
  Copy,
  Check,
  Car,
  Layers,
  FileVideo,
  AlertTriangle,
  VolumeX,
  RefreshCw,
  Wrench,
  ArrowRight,
  ChevronDown,
  Play,
  HardDrive,
} from 'lucide-react';
import {
  ArchiveSearchResult,
  AnalyzedLocalFile,
  CarVideoItem,
  VideoResolution,
} from '../types/media';
import { generateYoutubeDownloadScript } from '../services/videoMetadataVerifier';
import {
  analyzeLocalVideoFile,
  fromArchiveResult,
  fromLocalFile,
} from '../services/carItemFactory';
import { downloadSingleVideo } from '../services/usbExporter';
import { downloadBlob, useClipboard, useNotice } from '../utils/mediaHelpers';
import { NoticeBanner } from './NoticeBanner';

interface AddVideosViewProps {
  usbVideos: CarVideoItem[];
  onAddToUsb: (items: CarVideoItem[]) => number;
  onPreviewInCar: (item: CarVideoItem) => void;
  onGoToUsb: () => void;
  onOpenRepairTool: () => void;
}

type AddSourceTab = 'youtube' | 'archive' | 'import';

const YOUTUBE_PRESETS = [
  {
    label: 'Mix Vallenato',
    query: 'https://www.youtube.com/results?search_query=mix+vallenatos+clasicos+en+vivo',
    folder: 'Musica_Vallenato',
    isPlaylist: true,
  },
  {
    label: 'Salsa Clásica',
    query: 'https://www.youtube.com/results?search_query=mix+salsa+romantica+clasicos',
    folder: 'Musica_Salsa',
    isPlaylist: true,
  },
  {
    label: 'Rock en Español',
    query: 'https://www.youtube.com/results?search_query=rock+en+espanol+clasicos+80s+90s',
    folder: 'Musica_Rock',
    isPlaylist: true,
  },
  {
    label: 'Cumbia',
    query: 'https://www.youtube.com/results?search_query=mix+cumbias+clasicas+bailables',
    folder: 'Musica_Cumbia',
    isPlaylist: true,
  },
];

export const AddVideosView: React.FC<AddVideosViewProps> = ({
  usbVideos,
  onAddToUsb,
  onPreviewInCar,
  onGoToUsb,
  onOpenRepairTool,
}) => {
  const [activeSource, setActiveSource] = useState<AddSourceTab>('youtube');
  const { copiedKey, copy } = useClipboard();
  const { notice, showNotice, clearNotice } = useNotice(4500);

  // ---- TAB 1: YOUTUBE (UNIFIED SINGLE VIDEO + PLAYLIST SCRIPT) ----
  const [ytInput, setYtInput] = useState('');
  const [isPlaylistMode, setIsPlaylistMode] = useState(true);
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [targetFolder, setTargetFolder] = useState('USB_Musica_Auto');
  const [includeTrackPrefix, setIncludeTrackPrefix] = useState(true);
  const [organizeInSubfolder, setOrganizeInSubfolder] = useState(true);
  const [scriptPlatform, setScriptPlatform] = useState<'windows' | 'mac' | 'command'>('windows');
  const [showScriptPreview, setShowScriptPreview] = useState(false);

  const handleYtInputChange = (val: string) => {
    setYtInput(val);
    const lower = val.toLowerCase();
    if (lower.includes('list=') || lower.includes('/playlist') || lower.includes('search_query')) {
      setIsPlaylistMode(true);
    } else if (lower.includes('watch?v=') || lower.includes('youtu.be/') || lower.includes('/shorts/')) {
      setIsPlaylistMode(false);
    }
  };

  const scriptBundle = generateYoutubeDownloadScript({
    input: ytInput,
    isPlaylist: isPlaylistMode,
    resolution,
    targetFolder,
    includeTrackPrefix,
    organizeInSubfolder,
  });

  const handleDownloadYtScript = () => {
    const safeName = (targetFolder || 'USB_Musica_Auto').replace(/[^\w-]/g, '_');
    if (scriptPlatform === 'mac') {
      downloadBlob(scriptBundle.macSh, `Descargar_${safeName}.sh`);
      showNotice(`Script "Descargar_${safeName}.sh" descargado. Ejecútalo con bash en Terminal.`);
    } else {
      downloadBlob(scriptBundle.windowsBat, `Descargar_${safeName}.bat`);
      showNotice(`Script "Descargar_${safeName}.bat" descargado. Haz doble clic en tu PC.`);
    }
  };

  // ---- TAB 2: ARCHIVE.ORG SEARCH ----
  const [archiveQuery, setArchiveQuery] = useState('vallenato');
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [archiveResults, setArchiveResults] = useState<ArchiveSearchResult[]>([]);
  const [hasSearchedArchive, setHasSearchedArchive] = useState(false);

  const handleSearchArchive = async (customQuery?: string) => {
    const q = (customQuery ?? archiveQuery).trim();
    if (!q) return;

    setIsSearchingArchive(true);
    setHasSearchedArchive(true);
    try {
      const res = await fetch(`/api/archive-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setArchiveResults(data.results || []);
    } catch {
      setArchiveResults([]);
      showNotice('No se pudo conectar con Archive.org en este momento.', 'warning');
    } finally {
      setIsSearchingArchive(false);
    }
  };

  const isInUsb = (title: string, artist: string) =>
    usbVideos.some(
      (v) =>
        v.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        v.artist.trim().toLowerCase() === artist.trim().toLowerCase()
    );

  const handleAddArchiveItem = (item: ArchiveSearchResult) => {
    const carItem = fromArchiveResult(item);
    const addedCount = onAddToUsb([carItem]);
    if (addedCount > 0) {
      showNotice(`"${item.title}" añadido a Mi USB.`);
    } else {
      showNotice(`"${item.title}" ya estaba en Mi USB.`, 'info');
    }
  };

  // ---- TAB 3: LOCAL FILE IMPORT ----
  const [importedFiles, setImportedFiles] = useState<AnalyzedLocalFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter((f) =>
      /\.(mp4|m4v|webm|mkv|opus|ogg)$/i.test(f.name) ||
      f.type.includes('video') ||
      f.type.includes('audio')
    );

    if (validFiles.length === 0) {
      showNotice('Selecciona archivos de video MP4, M4V, MKV o WebM.', 'warning');
      return;
    }

    const startIdx = importedFiles.length;
    const analyzed = await Promise.all(
      validFiles.map((file, idx) => analyzeLocalVideoFile(file, startIdx + idx))
    );

    setImportedFiles((prev) => [...analyzed, ...prev]);

    const hasIssues = analyzed.some((a) => a.isSilentStream || a.isOpusOrVorbis);
    if (hasIssues) {
      showNotice(
        'Uno o más videos tienen audio incompatible o sin audio. Usa "Reparar audio" antes de llevarlos al coche.',
        'warning',
        6500
      );
    } else {
      showNotice(`${analyzed.length} video(s) analizados y listos para Mi USB.`);
    }
  };

  const handleAddSingleLocal = (idx: number) => {
    const target = importedFiles[idx];
    if (!target) return;
    const addedCount = onAddToUsb([fromLocalFile(target)]);
    setImportedFiles((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, status: 'added' } : item))
    );
    showNotice(
      addedCount > 0
        ? `"${target.safeCarName}" añadido a Mi USB.`
        : `"${target.safeCarName}" ya estaba en Mi USB.`,
      addedCount > 0 ? 'success' : 'info'
    );
  };

  const handleAddAllLocal = () => {
    const pending = importedFiles.filter((f) => f.status !== 'added');
    const items = (pending.length > 0 ? pending : importedFiles).map(fromLocalFile);
    const addedCount = onAddToUsb(items);
    setImportedFiles((prev) => prev.map((item) => ({ ...item, status: 'added' })));
    showNotice(
      addedCount > 0
        ? `${addedCount} video(s) añadidos a Mi USB.`
        : 'Todos estos videos ya estaban en Mi USB.',
      addedCount > 0 ? 'success' : 'info'
    );
  };

  const hasAudioWarnings = importedFiles.some((f) => f.isOpusOrVorbis || f.isSilentStream);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick USB Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            Añadir videos para tu USB
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Prepara archivos MP4 compatibles con pantallas de auto (H.264 + audio AAC).
          </p>
        </div>

        {usbVideos.length > 0 && (
          <button
            type="button"
            onClick={onGoToUsb}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-700/60 text-xs font-semibold text-emerald-300 transition-colors"
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>{usbVideos.length} en Mi USB · Preparar ZIP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <NoticeBanner notice={notice} onDismiss={clearNotice} />

      {/* 3 Clear Source Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveSource('youtube')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            activeSource === 'youtube'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Youtube className="w-4 h-4 shrink-0" />
          <span>YouTube (Script PC)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSource('archive');
            if (!hasSearchedArchive) handleSearchArchive('vallenato');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            activeSource === 'archive'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>Buscar gratis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSource('import')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            activeSource === 'import'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span>
            Importar MP4{importedFiles.length > 0 ? ` (${importedFiles.length})` : ''}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: YOUTUBE (UNIFIED YT-DLP + FFMPEG SCRIPT)              */}
      {/* ============================================================ */}
      {activeSource === 'youtube' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          {/* Input & Mode */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="yt-input" className="text-sm font-semibold text-white">
                Pega un enlace de YouTube (video o lista) o escribe lo que buscas
              </label>

              <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs self-start">
                <button
                  type="button"
                  onClick={() => setIsPlaylistMode(false)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    !isPlaylistMode
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Video único
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaylistMode(true)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    isPlaylistMode
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lista / Mix
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="yt-input"
                type="text"
                value={ytInput}
                onChange={(e) => handleYtInputChange(e.target.value)}
                placeholder="Ej. https://www.youtube.com/playlist?list=... o Carlos Vives - La Gota Fría"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quick genre suggestions */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400">Ideas rápidas:</span>
              {YOUTUBE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setYtInput(preset.query);
                    setTargetFolder(preset.folder);
                    setIsPlaylistMode(preset.isPlaylist);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="block text-slate-400 font-medium mb-1.5">Resolución</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['720p', '1080p'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`flex-1 py-1.5 rounded font-semibold transition-colors ${
                      resolution === res
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {res === '720p' ? '720p (Auto)' : '1080p HD'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="yt-folder" className="block text-slate-400 font-medium mb-1.5">
                Carpeta destino
              </label>
              <input
                id="yt-folder"
                type="text"
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value.replace(/[^\w-]/g, '_'))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {isPlaylistMode && (
              <>
                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer self-end">
                  <span className="text-slate-300">Numerar pistas (01 - )</span>
                  <input
                    type="checkbox"
                    checked={includeTrackPrefix}
                    onChange={(e) => setIncludeTrackPrefix(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer self-end">
                  <span className="text-slate-300">Subcarpeta por lista</span>
                  <input
                    type="checkbox"
                    checked={organizeInSubfolder}
                    onChange={(e) => setOrganizeInSubfolder(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              </>
            )}
          </div>

          {/* Script Generator */}
          <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(['windows', 'mac', 'command'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setScriptPlatform(plat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      scriptPlatform === plat
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {plat === 'windows'
                      ? 'Windows (.bat)'
                      : plat === 'mac'
                        ? 'Mac / Linux (.sh)'
                        : 'Comando terminal'}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                yt-dlp + FFmpeg · H.264 + AAC · ~{resolution === '720p' ? '45' : '75'} MB/video
              </span>
            </div>

            {scriptPlatform === 'command' ? (
              <div className="space-y-3">
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto select-all">
                  {scriptBundle.singleLineCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => copy(scriptBundle.singleLineCommand, 'yt-cmd')}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg inline-flex items-center gap-2"
                >
                  {copiedKey === 'yt-cmd' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedKey === 'yt-cmd' ? 'Comando copiado' : 'Copiar comando'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadYtScript}
                    className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Descargar script {scriptPlatform === 'windows' ? 'Windows (.bat)' : 'Mac / Linux (.sh)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copy(
                        scriptPlatform === 'windows'
                          ? scriptBundle.windowsBat
                          : scriptBundle.macSh,
                        'yt-script'
                      )
                    }
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2"
                  >
                    {copiedKey === 'yt-script' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedKey === 'yt-script' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <span>
                    Haz doble clic al archivo en tu PC: instala <code className="text-cyan-300">yt-dlp</code> y{' '}
                    <code className="text-cyan-300">FFmpeg</code> si faltan y descarga los MP4 con audio AAC.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScriptPreview((v) => !v)}
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1 shrink-0 self-start"
                  >
                    <span>{showScriptPreview ? 'Ocultar código' : 'Ver código'}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showScriptPreview ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {showScriptPreview && (
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60">
                    {scriptPlatform === 'windows'
                      ? scriptBundle.windowsBat
                      : scriptBundle.macSh}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>¿Ya descargaste los videos en tu carpeta?</span>
            <button
              type="button"
              onClick={() => setActiveSource('import')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
            >
              <span>Importar archivos MP4</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ARCHIVE.ORG DIRECT SEARCH                             */}
      {/* ============================================================ */}
      {activeSource === 'archive' && (
        <div className="space-y-5">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-slate-300">
                Videos y conciertos de dominio público en <strong className="text-white">Internet Archive</strong> listos para añadir a tu USB o probar.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchArchive();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveQuery}
                  onChange={(e) => setArchiveQuery(e.target.value)}
                  placeholder="Buscar videos MP4 (ej. vallenato, salsa en vivo, cumbia, rock)..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingArchive}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearchingArchive ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </form>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {['vallenato', 'salsa en vivo', 'cumbia clasica', 'rock concert', 'latin music'].map(
                (tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setArchiveQuery(tag);
                      handleSearchArchive(tag);
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>

          {isSearchingArchive ? (
            <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300">Buscando MP4 en Internet Archive...</p>
            </div>
          ) : archiveResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archiveResults.map((item) => {
                const alreadyAdded = isInUsb(item.title, item.artist);
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span className="truncate">{item.artist}</span>
                        <span className="text-emerald-400 shrink-0">{item.resolution}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-2">{item.title}</h3>
                      <div className="text-xs text-slate-400 mt-1.5 font-mono">
                        {item.durationFormatted} · {item.fileSizeMb} MB
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddArchiveItem(item)}
                        disabled={alreadyAdded}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          alreadyAdded
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>En Mi USB</span>
                          </>
                        ) : (
                          <>
                            <Layers className="w-3.5 h-3.5" />
                            <span>Añadir a Mi USB</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onPreviewInCar(fromArchiveResult(item))}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg"
                        title="Probar en el auto"
                      >
                        <Play className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadSingleVideo(fromArchiveResult(item))}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                        title="Descargar MP4"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : hasSearchedArchive ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-400">
              No se encontraron archivos MP4 para esa búsqueda. Prueba otro género o artista.
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: IMPORT LOCAL MP4 FILES                                */}
      {/* ============================================================ */}
      {activeSource === 'import' && (
        <div className="space-y-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              processFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-900/70 hover:bg-slate-900 transition-colors p-8 sm:p-10 rounded-2xl text-center cursor-pointer space-y-2.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/mp4,video/m4v,video/webm,video/x-matroska,.mp4,.m4v,.webm,.mkv"
              className="hidden"
              onChange={(e) => processFiles(e.target.files)}
            />
            <FileVideo className="w-10 h-10 text-cyan-400 mx-auto" />
            <p className="text-sm font-semibold text-white">
              Arrastra tus videos aquí o haz clic para seleccionarlos
            </p>
            <p className="text-xs text-slate-400">
              Analizamos el audio y preparamos nombres compatibles con FAT32 para tu estéreo.
            </p>
          </div>

          {importedFiles.length > 0 && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-white">
                  Videos analizados ({importedFiles.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddAllLocal}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Añadir todos a Mi USB</span>
                </button>
              </div>

              {hasAudioWarnings && (
                <div className="p-3.5 bg-amber-950/60 border border-amber-600/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Hay archivos sin pista de audio o con códec Opus/Vorbis que no sonarán en la radio del coche.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenRepairTool}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Reparar carpeta (1-Clic)</span>
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                {importedFiles.map((df, i) => (
                  <div
                    key={df.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {df.isSilentStream ? (
                          <VolumeX className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : df.isOpusOrVorbis ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <FileVideo className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white font-semibold truncate">{df.safeCarName}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                df.isSilentStream
                                  ? 'bg-red-950 text-red-300 border border-red-700/70'
                                  : df.isOpusOrVorbis
                                    ? 'bg-amber-950 text-amber-300 border border-amber-700/70'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700/70'
                              }`}
                            >
                              {df.isSilentStream
                                ? 'Sin audio'
                                : df.isOpusOrVorbis
                                  ? 'Opus/Vorbis'
                                  : 'AAC OK'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                            {df.name} · {df.sizeMb} MB · {df.audioCodec}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onPreviewInCar(fromLocalFile(df))}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg inline-flex items-center gap-1"
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>Probar</span>
                        </button>

                        {df.status === 'added' ? (
                          <span className="px-2.5 py-1.5 text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>En Mi USB</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddSingleLocal(i)}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg"
                          >
                            Añadir a Mi USB
                          </button>
                        )}
                      </div>
                    </div>

                    {df.suggestedFfmpegCommand && (
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                        <code className="font-mono text-[11px] text-cyan-300 truncate">
                          {df.suggestedFfmpegCommand}
                        </code>
                        <button
                          type="button"
                          onClick={() => copy(df.suggestedFfmpegCommand || '', df.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] shrink-0 inline-flex items-center gap-1"
                        >
                          {copiedKey === df.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === df.id ? 'Copiado' : 'Copiar FFmpeg'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

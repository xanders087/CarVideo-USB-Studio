import React, { useState, useMemo } from 'react';
import {
  HardDrive,
  Folder,
  FileVideo,
  FileText,
  Download,
  Trash2,
  Car,
  FolderTree,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Layers,
  PlusCircle,
  Wrench,
} from 'lucide-react';
import {
  CAR_VIDEO_GENRES,
  CarVideoGenre,
  CarVideoItem,
  UsbExportSettings,
  StereoCompatibilityReport,
} from '../types/media';
import {
  buildUsbVirtualTree,
  checkStereoCompatibility,
  createUsbZipArchive,
  downloadSingleVideo,
  UsbFolderNode,
} from '../services/usbExporter';
import { downloadBlob, useNotice } from '../utils/mediaHelpers';
import { NoticeBanner } from './NoticeBanner';

interface UsbManagerViewProps {
  videos: CarVideoItem[];
  onRemoveVideo: (id: string) => void;
  onClearAll: () => void;
  onPlayInCar: (video: CarVideoItem) => void;
  onNavigateToAdd: () => void;
  onOpenRepairTool: () => void;
  onUpdateGenre: (id: string, genre: CarVideoGenre) => void;
}

export const UsbManagerView: React.FC<UsbManagerViewProps> = ({
  videos,
  onRemoveVideo,
  onClearAll,
  onPlayInCar,
  onNavigateToAdd,
  onOpenRepairTool,
  onUpdateGenre,
}) => {
  const [settings, setSettings] = useState<UsbExportSettings>({
    organizationMode: 'by-genre',
    cleanFilenamesForStereos: true,
    generateM3uPlaylists: true,
    addTrackNumberPrefix: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: '',
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '/': true,
  });

  const { notice, showNotice, clearNotice } = useNotice(5500);

  const virtualTree = useMemo(
    () => buildUsbVirtualTree(videos, settings),
    [videos, settings]
  );

  const compatibilityReport: StereoCompatibilityReport = useMemo(
    () => checkStereoCompatibility(videos),
    [videos]
  );

  const totalSizeMb = compatibilityReport.totalSizeMb;
  const capacityPercent16Gb = Math.min(100, Math.round((totalSizeMb / 16000) * 1000) / 10);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }));
  };

  const handleExportZip = async () => {
    if (videos.length === 0) return;
    setIsExporting(true);
    clearNotice();

    try {
      const result = await createUsbZipArchive(videos, settings, (percent, status) => {
        setExportProgress({ percent, status });
      });

      const suffix = settings.organizationMode === 'by-genre' ? 'POR_GENEROS' : 'PLANO';
      downloadBlob(
        result.blob,
        `USB_COCHE_${result.includedCount}_VIDEOS_${suffix}.zip`,
        'application/zip'
      );

      if (result.failedItems.length > 0) {
        const failedNames = result.failedItems.map((f) => f.title).join(', ');
        showNotice(
          `ZIP descargado con ${result.includedCount} video(s). No se pudieron descargar ${result.failedItems.length} (${failedNames}); revisa LEEME_INSTRUCCIONES_COCHE.txt o descárgalos en MP4 individual.`,
          'warning',
          9000
        );
      } else {
        showNotice(
          '¡Paquete ZIP descargado! Descomprime las carpetas directamente en la raíz de tu memoria USB.'
        );
      }
    } catch (err) {
      console.error('Error al empaquetar USB:', err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo generar el ZIP completo. Puedes descargar cada MP4 individualmente.';
      showNotice(message, 'warning', 9000);
    } finally {
      setIsExporting(false);
    }
  };

  const renderTreeNode = (node: UsbFolderNode, depth = 0) => {
    const paddingStyle = { paddingLeft: `${Math.max(8, depth * 16)}px` };

    if (node.type === 'folder') {
      const isExpanded = expandedFolders[node.path] ?? true;
      return (
        <div key={node.path} className="select-none text-xs">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-800/80 font-medium text-left"
            style={paddingStyle}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-100 font-semibold truncate">{node.name}</span>
          </button>

          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const isMetaFile = node.name.endsWith('.m3u') || node.name.endsWith('.txt');
    return (
      <div key={node.path} className="select-none text-xs">
        <div
          className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors hover:bg-slate-800/40 text-slate-300"
          style={paddingStyle}
        >
          {isMetaFile ? (
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-4" />
          ) : (
            <FileVideo className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-4" />
          )}
          <span className="truncate">{node.name}</span>
          {node.sizeMb !== undefined && node.sizeMb > 0 && (
            <span className="text-[10px] text-slate-500 font-mono tabular-nums ml-auto shrink-0">
              {node.sizeMb} MB
            </span>
          )}
        </div>
      </div>
    );
  };

  if (videos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-14 px-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <HardDrive className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
          Tu memoria USB está vacía
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Añade videos desde Archive.org o importa los MP4 de tu computadora para organizarlos y descargarlos listos para la pantalla de tu coche.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onNavigateToAdd}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ir a Añadir videos</span>
          </button>

          <a
            href="/api/download/video?file=test.mp4&title=Video_Prueba_H264_AAC.mp4"
            download="Video_Prueba_H264_AAC.mp4"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Descargar MP4 de prueba</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NoticeBanner notice={notice} onDismiss={clearNotice} />

      {/* Top Summary & Primary ZIP Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              Mi USB ({videos.length} {videos.length === 1 ? 'video' : 'videos'})
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Elige cómo ordenar tus carpetas y descarga el paquete listo para copiar a tu pendrive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleExportZip()}
            disabled={isExporting}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Generando ZIP ({exportProgress.percent}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar todo para USB (.ZIP)</span>
              </>
            )}
          </button>
        </div>

        {/* USB Capacity Gauge */}
        <div className="pt-3 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>
              Espacio estimado: <strong className="text-cyan-400">{totalSizeMb} MB</strong>
            </span>
            <span>{capacityPercent16Gb}% de una USB de 16 GB</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.max(2, capacityPercent16Gb)}%` }}
            />
          </div>
        </div>

        {isExporting && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-400 flex justify-between">
            <span className="truncate">{exportProgress.status}</span>
            <span className="tabular-nums shrink-0 ml-2">{exportProgress.percent}%</span>
          </div>
        )}
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Organization Settings & Virtual Tree (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Organización en USB</span>
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="usb-mode-genre"
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.organizationMode === 'by-genre'
                    ? 'bg-cyan-950/30 border-cyan-500/70 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  id="usb-mode-genre"
                  type="radio"
                  name="usbMode"
                  checked={settings.organizationMode === 'by-genre'}
                  onChange={() => setSettings((s) => ({ ...s, organizationMode: 'by-genre' }))}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="block">
                  <span className="block text-xs font-semibold">Carpetas por género</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Agrupa en carpetas como <code className="text-cyan-300">/Vallenato/</code> o{' '}
                    <code className="text-cyan-300">/Otros/</code>.
                  </span>
                </span>
              </label>

              <label
                htmlFor="usb-mode-flat"
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.organizationMode === 'flat'
                    ? 'bg-cyan-950/30 border-cyan-500/70 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  id="usb-mode-flat"
                  type="radio"
                  name="usbMode"
                  checked={settings.organizationMode === 'flat'}
                  onChange={() => setSettings((s) => ({ ...s, organizationMode: 'flat' }))}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="block">
                  <span className="block text-xs font-semibold">Todo en una carpeta (Plano)</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Todos los MP4 en la raíz de la USB. Ideal para estéreos antiguos.
                  </span>
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <label
                htmlFor="usb-clean-filenames"
                className="flex items-center justify-between text-slate-300 cursor-pointer"
              >
                <span>Nombres seguros para FAT32</span>
                <input
                  id="usb-clean-filenames"
                  type="checkbox"
                  checked={settings.cleanFilenamesForStereos}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, cleanFilenamesForStereos: e.target.checked }))
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label
                htmlFor="usb-track-prefix"
                className="flex items-center justify-between text-slate-300 cursor-pointer"
              >
                <span>Numerar pistas (01 - , 02 - )</span>
                <input
                  id="usb-track-prefix"
                  type="checkbox"
                  checked={settings.addTrackNumberPrefix}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, addTrackNumberPrefix: e.target.checked }))
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label
                htmlFor="usb-m3u-playlists"
                className="flex items-center justify-between text-slate-300 cursor-pointer"
              >
                <span>Incluir lista (.M3U)</span>
                <input
                  id="usb-m3u-playlists"
                  type="checkbox"
                  checked={settings.generateM3uPlaylists}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, generateM3uPlaylists: e.target.checked }))
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>

          {/* Compatibility & Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span>Vista previa de carpetas</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>FAT32</span>
              </span>
            </div>

            {compatibilityReport.warnings.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 space-y-1.5">
                <div className="font-semibold flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Avisos de compatibilidad</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenRepairTool}
                    className="text-amber-300 hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Reparar</span>
                  </button>
                </div>
                {compatibilityReport.warnings.map((w) => (
                  <p key={w} className="text-[11px] leading-snug">
                    • {w}
                  </p>
                ))}
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-64 overflow-y-auto font-mono">
              {renderTreeNode(virtualTree)}
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>¿Problemas para abrir MP4 en Windows?</span>
              <a
                href="/api/download/video?file=test.mp4&title=Video_Prueba_H264_AAC.mp4"
                download="Video_Prueba_H264_AAC.mp4"
                className="text-cyan-400 hover:underline font-medium"
              >
                Bajar MP4 de prueba
              </a>
            </div>
          </div>
        </div>

        {/* Right: Video List (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Videos en esta USB ({videos.length})
            </h2>

            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar lista</span>
            </button>
          </div>

          <div className="space-y-2">
            {videos.map((video, idx) => {
              const audioLower = video.audioCodec.toLowerCase();
              const hasIssue =
                audioLower.includes('sin audio') ||
                audioLower.includes('opus') ||
                audioLower.includes('vorbis');
              const isUnverifiedAudio = !hasIssue && audioLower.includes('sin verificar');

              return (
                <div
                  key={video.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-cyan-400 font-bold text-xs shrink-0 w-6">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{video.title}</div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-cyan-400 truncate max-w-[140px]">{video.artist}</span>
                        <span aria-hidden="true">·</span>
                        <select
                          aria-label={`Género para ${video.title}`}
                          value={video.genre}
                          onChange={(e) =>
                            onUpdateGenre(video.id, e.target.value as CarVideoGenre)
                          }
                          className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500"
                        >
                          {CAR_VIDEO_GENRES.map((genreOption) => (
                            <option key={genreOption} value={genreOption}>
                              {genreOption}
                            </option>
                          ))}
                        </select>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{video.durationFormatted}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-emerald-400">
                          {video.fileSizeMb > 0 ? `${video.fileSizeMb} MB` : 'Tamaño N/D'}
                        </span>
                        {hasIssue && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-700/70 font-mono">
                            Audio incompatible
                          </span>
                        )}
                        {isUnverifiedAudio && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-700 font-mono">
                            Audio sin verificar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPlayInCar(video)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                      title="Probar en el auto"
                      aria-label={`Probar ${video.title} en el auto`}
                    >
                      <Car className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadSingleVideo(video, idx)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Descargar MP4 individual"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">MP4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveVideo(video.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Quitar de Mi USB"
                      aria-label={`Quitar ${video.title} de Mi USB`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  HardDrive, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Car, 
  ArrowRight, 
  Layers, 
  FileVideo, 
  ListPlus, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { CarVideoItem, Playlist, UsbExportSettings } from '../types/media';
import { createUsbZipArchive, downloadSingleVideo } from '../services/usbExporter';

interface UsbStagingQueueProps {
  stagingVideos: CarVideoItem[];
  onRemoveFromStaging: (id: string) => void;
  onClearStaging: () => void;
  onCommitToLibrary: (videos: CarVideoItem[]) => void;
  onPlayInCar: (video: CarVideoItem) => void;
  onNavigateToSearch: () => void;
  playlists: Playlist[];
}

export const UsbStagingQueue: React.FC<UsbStagingQueueProps> = ({
  stagingVideos,
  onRemoveFromStaging,
  onClearStaging,
  onCommitToLibrary,
  onPlayInCar,
  onNavigateToSearch,
  playlists
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: ''
  });
  const [exportDone, setExportDone] = useState(false);

  const totalSizeMb = Math.round(stagingVideos.reduce((sum, v) => sum + v.fileSizeMb, 0) * 10) / 10;
  
  // Calculate percentage of typical 16GB USB drive (16,000 MB)
  const capacityPercent16Gb = Math.min(100, Math.round((totalSizeMb / 16000) * 1000) / 10);

  const handleDownloadZip = async () => {
    if (stagingVideos.length === 0) return;
    setIsExporting(true);
    setExportDone(false);

    const defaultSettings: UsbExportSettings = {
      organizationMode: 'by-genre',
      targetFileSystem: 'FAT32',
      cleanFilenamesForStereos: true,
      generateM3uPlaylists: true,
      addTrackNumberPrefix: true,
      volumeNormalizationNotice: true
    };

    try {
      const zipBlob = await createUsbZipArchive(
        stagingVideos,
        playlists,
        defaultSettings,
        (percent, status) => {
          setExportProgress({ percent, status });
        }
      );

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `USB_COCHE_STAGING_${stagingVideos.length}_VIDEOS.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setExportDone(true);
    } catch (err) {
      console.error('Error al empaquetar:', err);
      alert('Hubo un error al crear el archivo ZIP. Puedes descargar los videos individualmente.');
    } finally {
      setIsExporting(false);
    }
  };

  if (stagingVideos.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 px-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <HardDrive className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-display">
          La Cola Temporal para USB está Vacía
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Utiliza el módulo de <strong>Descargas Web</strong> o la zona de importación para añadir videos con códec MP4 y audio AAC compatible. Los videos que selecciones aparecerán aquí para ser empaquetados juntos hacia tu memoria USB.
        </p>
        <button
          onClick={onNavigateToSearch}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 mx-auto"
        >
          <Layers className="w-4 h-4" />
          <span>Ir a Descargas Web</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header & Storage Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
              <HardDrive className="w-4 h-4" />
              <span>Bandeja de Preparación Staging</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-display">
              Cola Temporal para Memoria USB ({stagingVideos.length} videos)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Revisa los videos oficiales aprobados antes de transferirlos a la unidad flash de tu vehículo.
            </p>
          </div>

          {/* Primary Action: Download ZIP */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generando ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Todos a USB (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Storage Capacity Gauge */}
        <div className="pt-3 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Espacio ocupado en USB: <strong className="text-cyan-400">{totalSizeMb} MB</strong></span>
            <span>{capacityPercent16Gb}% de una memoria USB estándar de 16 GB</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.max(3, capacityPercent16Gb)}%` }}
            />
          </div>
        </div>

        {/* Export Progress Bar */}
        {isExporting && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs font-mono text-cyan-400">
              <span>{exportProgress.status}</span>
              <span>{exportProgress.percent}%</span>
            </div>
          </div>
        )}

        {/* Export Done Notice */}
        {exportDone && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Paquete de videos descargado! Descomprime los archivos directamente en tu memoria USB.</span>
          </div>
        )}
      </div>

      {/* Batch Sub-Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Todos los archivos cumplen con el perfil automotriz <strong>H.264 / AAC 320k</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCommitToLibrary(stagingVideos)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
            title="Guardar también en el catálogo permanente"
          >
            <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guardar en Catálogo Permanente</span>
          </button>

          <button
            onClick={onClearStaging}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Cola</span>
          </button>
        </div>
      </div>

      {/* Queued Video List */}
      <div className="space-y-2">
        {stagingVideos.map((video, idx) => (
          <div
            key={video.id}
            className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="font-mono text-cyan-400 font-bold text-xs shrink-0 w-6">
                {String(idx + 1).padStart(2, '0')}.
              </span>

              <div className="truncate">
                <div className="text-sm font-bold text-white truncate">
                  {video.title}
                </div>
                <div className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                  <span className="text-cyan-400">{video.artist}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{video.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{video.durationFormatted}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-emerald-400">{video.fileSizeMb} MB</span>
                </div>
              </div>
            </div>

            {/* Quick Actions for this item */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onPlayInCar(video)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                title="Probar en pantalla de auto"
              >
                <Car className="w-4 h-4" />
              </button>

              <button
                onClick={() => downloadSingleVideo(video, idx)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Descargar este archivo MP4 individualmente"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>MP4</span>
              </button>

              <button
                onClick={() => onRemoveFromStaging(video.id)}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Quitar de la cola"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

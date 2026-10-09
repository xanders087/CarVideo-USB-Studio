import React, { useState, useMemo } from 'react';
import { 
  HardDrive, 
  Folder, 
  FileVideo, 
  FileText, 
  Download, 
  CheckCircle2, 
  Sliders, 
  FolderTree, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown,
  Layers,
  ListMusic,
  Check,
  Monitor,
  HelpCircle,
  Play
} from 'lucide-react';
import { 
  CarVideoItem, 
  Playlist, 
  UsbExportSettings, 
  UsbOrganizationMode,
  StereoCompatibilityReport 
} from '../types/media';
import { 
  buildUsbVirtualTree, 
  checkStereoCompatibility, 
  createUsbZipArchive, 
  downloadSingleVideo,
  UsbFolderNode
} from '../services/usbExporter';

interface UsbDriveManagerProps {
  videos: CarVideoItem[];
  playlists: Playlist[];
  onOpenPlaylistModal: () => void;
}

export const UsbDriveManager: React.FC<UsbDriveManagerProps> = ({
  videos,
  playlists,
  onOpenPlaylistModal
}) => {
  const [settings, setSettings] = useState<UsbExportSettings>({
    organizationMode: 'by-genre',
    targetFileSystem: 'FAT32',
    cleanFilenamesForStereos: true,
    generateM3uPlaylists: true,
    addTrackNumberPrefix: true,
    volumeNormalizationNotice: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: ''
  });
  const [exportComplete, setExportComplete] = useState(false);
  const [showTroubleshootingGuide, setShowTroubleshootingGuide] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '/': true,
    '/Synthwave': true,
    '/Rock': true,
    '/Carretera Nocturna': true
  });

  const virtualTree = useMemo(() => {
    return buildUsbVirtualTree(videos, playlists, settings.organizationMode);
  }, [videos, playlists, settings.organizationMode]);

  const compatibilityReport: StereoCompatibilityReport = useMemo(() => {
    return checkStereoCompatibility(videos);
  }, [videos]);

  const totalSizeMb = useMemo(() => {
    return Math.round(videos.reduce((sum, v) => sum + v.fileSizeMb, 0) * 10) / 10;
  }, [videos]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleStartExportZip = async () => {
    if (videos.length === 0) return;
    setIsExporting(true);
    setExportComplete(false);

    try {
      const zipBlob = await createUsbZipArchive(
        videos, 
        playlists, 
        settings, 
        (percent, status) => {
          setExportProgress({ percent, status });
        }
      );

      // Trigger download of the ZIP bundle
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `USB_MUSICA_COCHE_HD_${settings.organizationMode === 'by-genre' ? 'GENEROS' : 'LISTAS'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setExportComplete(true);
    } catch (err) {
      console.error('Error al empaquetar USB:', err);
      alert('Hubo un inconveniente al generar el paquete. Puedes descargar los videos individualmente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTestSample = () => {
    setIsDownloadingSample(true);
    try {
      const a = document.createElement('a');
      a.href = '/api/download/video?file=test.mp4&title=Video_Prueba_H264_AAC.mp4';
      a.download = 'Video_Prueba_H264_AAC.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setIsDownloadingSample(false), 1500);
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: UsbFolderNode, depth = 0) => {
    const isExpanded = expandedFolders[node.path] ?? false;
    const isFolder = node.type === 'folder';

    return (
      <div key={node.path} className="select-none text-xs">
        <div 
          onClick={() => isFolder && toggleFolder(node.path)}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
            isFolder ? 'hover:bg-slate-800/80 font-medium' : 'hover:bg-slate-800/40 text-slate-300'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 18)}px` }}
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-100 font-semibold">{node.name}</span>
            </>
          ) : (
            <>
              {node.name.endsWith('.m3u') ? (
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-4" />
              ) : node.name.endsWith('.txt') ? (
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-4" />
              ) : (
                <FileVideo className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-4" />
              )}
              <span className="truncate">{node.name}</span>
              {node.sizeMb && (
                <span className="text-[10px] text-slate-500 font-mono tabular-nums ml-auto shrink-0">
                  {node.sizeMb} MB
                </span>
              )}
            </>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Overview & Mode Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
              <HardDrive className="w-4 h-4" />
              <span>Organizador & Generador para Memoria USB</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-display">
              Estructura de la Memoria USB para tu Coche
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Configura cómo deseas que los videos se ordenen en las carpetas de tu memoria USB para que el estéreo o pantalla multimedia los lea sin demoras.
            </p>
          </div>

          {/* Big Export Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartExportZip}
              disabled={isExporting || videos.length === 0}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 shrink-0 active:scale-95"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Preparando USB...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Descargar Paquete USB (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Progress Bar if exporting */}
        {isExporting && (
          <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs font-mono text-cyan-400">
              <span>{exportProgress.status}</span>
              <span className="tabular-nums">{exportProgress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 transition-all duration-300" 
                style={{ width: `${exportProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Notice */}
        {exportComplete && (
          <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center gap-3 text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">¡Paquete descargado con éxito!</span> Solo descomprime el contenido en la raíz de tu memoria USB y conéctala a tu vehículo.
            </div>
          </div>
        )}

        {/* Playback Diagnostic & Help Trigger */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>¿Mensaje de error al abrir videos en tu PC o pantalla?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTestSample}
              disabled={isDownloadingSample}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium flex items-center gap-1.5 transition-colors border border-slate-700 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingSample ? 'Descargando muestra...' : 'Descargar Video de Prueba MP4'}</span>
            </button>
            <button
              onClick={() => setShowTroubleshootingGuide(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors border border-cyan-800/50"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showTroubleshootingGuide ? 'Ocultar Solución' : 'Ver Guía de Solución PC'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTroubleshootingGuide ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Diagnostic & Solutions Guide */}
        {showTroubleshootingGuide && (
          <div className="mt-4 p-5 bg-slate-950 border border-cyan-800/40 rounded-xl text-slate-300 text-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  ¿Por qué ocurrió el error al reproducir en tu PC (Ej: &quot;No se puede reproducir&quot; / Formato no admitido)?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Hay 3 motivos principales por los que los reproductores de PC (especialmente Windows) muestran ese aviso:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Extensión oculta en Windows</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Windows oculta extensiones conocidas por defecto. Si se descargó un enlace o archivo incompleto, el reproductor intenta decodificar texto en vez de video binario.
                </p>
                <div className="text-[11px] text-emerald-400 font-medium">✓ Solución: Ahora todos los archivos son binarios MP4 100% reales.</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Reproductor &quot;Películas y TV&quot;</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  La app antigua &quot;Películas y TV&quot; de Windows 10/11 a menudo carece de filtros para streams estéreo directos o muestra error 0xc00d36c4.
                </p>
                <div className="text-[11px] text-cyan-300 font-medium">✓ Solución: Abre el video con <strong className="text-white">Reproductor Multimedia de Windows</strong> o <strong className="text-white">VLC Player</strong>.</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Cabecera FastStart (moov atom)</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Los estéreos de auto y PC requieren que el índice del video esté al principio del archivo para iniciar la reproducción al instante.
                </p>
                <div className="text-[11px] text-emerald-400 font-medium">✓ Solución: Todos nuestros MP4 están compilados con códec H.264/AAC y FastStart.</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-slate-300">
                💡 <strong className="text-white">Comprobación rápida:</strong> Haz clic en &quot;Descargar Video de Prueba MP4&quot; para validar que tu reproductor de PC reproduce perfectamente nuestro códec oficial.
              </span>
              <button
                onClick={handleDownloadTestSample}
                className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shrink-0 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar y Probar Ahora</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: USB Settings & Organization Mode (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Organization Mode Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Modo de Organización en USB</span>
            </h3>

            <div className="space-y-2.5">
              {/* Option A: By Musical Genre */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.organizationMode === 'by-genre'
                    ? 'bg-cyan-950/30 border-cyan-500/80 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="usbMode"
                  value="by-genre"
                  checked={settings.organizationMode === 'by-genre'}
                  onChange={() => setSettings(s => ({ ...s, organizationMode: 'by-genre' }))}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <span>Carpetas por Género Musical</span>
                    <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded font-mono">Recomendado</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Crea carpetas limpias como <code className="text-cyan-300 font-mono">/Rock/</code>, <code className="text-cyan-300 font-mono">/Synthwave/</code>, <code className="text-cyan-300 font-mono">/Pop Latino/</code>. Ideal para buscar por estilo musical desde los botones del volante.
                  </p>
                </div>
              </label>

              {/* Option B: By Playlists */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.organizationMode === 'by-playlist'
                    ? 'bg-cyan-950/30 border-cyan-500/80 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="usbMode"
                  value="by-playlist"
                  checked={settings.organizationMode === 'by-playlist'}
                  onChange={() => setSettings(s => ({ ...s, organizationMode: 'by-playlist' }))}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">
                    Carpetas por Listas de Reproducción
                  </div>
                  <p className="text-xs text-slate-400">
                    Agrupa por listas de viaje personalizadas (<code className="text-cyan-300 font-mono">/Carretera Nocturna/</code>, <code className="text-cyan-300 font-mono">/Ruta Tropical/</code>) con sus archivos <code className="text-cyan-300 font-mono">.m3u</code> correspondientes.
                  </p>
                </div>
              </label>
            </div>

            {/* Automotive Options */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Sanitizar nombres para FAT32 (eliminar símbolos prohibidos)</span>
                <input
                  type="checkbox"
                  checked={settings.cleanFilenamesForStereos}
                  onChange={(e) => setSettings(s => ({ ...s, cleanFilenamesForStereos: e.target.checked }))}
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Generar archivos de lista de reproducción (.M3U)</span>
                <input
                  type="checkbox"
                  checked={settings.generateM3uPlaylists}
                  onChange={(e) => setSettings(s => ({ ...s, generateM3uPlaylists: e.target.checked }))}
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Prefijo numérico de pista (01 - , 02 - ...)</span>
                <input
                  type="checkbox"
                  checked={settings.addTrackNumberPrefix}
                  onChange={(e) => setSettings(s => ({ ...s, addTrackNumberPrefix: e.target.checked }))}
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>

          {/* Stereo Compatibility Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white font-display">
                Verificador de Compatibilidad Vehicular
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Sistema de Archivos:</span>
                <span className="text-emerald-400 font-mono font-bold">FAT32 / exFAT 100% Seguro</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Códec de Video:</span>
                <span className="text-slate-200 font-mono">H.264 (AVC) Baseline/High</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Códec de Audio:</span>
                <span className="text-slate-200 font-mono">AAC 44.1/48 kHz Stereo</span>
              </div>
            </div>

            {compatibilityReport.warnings.length > 0 && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Avisos de pantalla de vehículo:</span>
                </div>
                {compatibilityReport.warnings.map((w, idx) => (
                  <p key={idx} className="text-[11px] text-amber-200/90 leading-relaxed">
                    • {w}
                  </p>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interactive USB File Tree Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Vista Previa del Árbol de Carpetas USB
                </h3>
              </div>

              {/* USB Capacity Gauge */}
              <div className="text-right">
                <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
                  {totalSizeMb} MB
                </span>
                <span className="text-[11px] text-slate-500 block">
                  en {videos.length} videos MP4 HD
                </span>
              </div>
            </div>

            {/* Tree Container */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[340px] max-h-[460px] overflow-y-auto font-mono text-xs">
              {videos.length === 0 ? (
                <div className="h-full min-h-[280px] flex flex-col items-center justify-center p-8 text-center text-slate-500 font-sans space-y-2">
                  <FolderTree className="w-8 h-8 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">No hay videos en la memoria USB (0 archivos)</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Descarga o importa canciones desde Descargas Web para visualizar aquí el árbol de carpetas organizado en formato FAT32.
                  </p>
                </div>
              ) : (
                renderTreeNode(virtualTree)
              )}
            </div>
          </div>

          {/* Quick Direct Download List for Single Videos */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>¿Prefieres descargar archivos sueltos a tu USB?</span>
              <span className="text-[11px] font-mono">{videos.length} disponibles</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {videos.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  No hay archivos sueltos todavía en la biblioteca.
                </div>
              ) : (
                videos.map((vid, idx) => (
                  <div 
                    key={vid.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="truncate mr-3">
                      <span className="font-mono text-cyan-400 mr-2">{String(idx + 1).padStart(2, '0')}.</span>
                      <span className="text-slate-200 font-medium">{vid.title}</span>
                      <span className="text-slate-500 text-[11px] ml-2">({vid.artist})</span>
                    </div>

                    <button
                      onClick={() => downloadSingleVideo(vid, idx)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      title="Descargar archivo MP4 directamente"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>MP4</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

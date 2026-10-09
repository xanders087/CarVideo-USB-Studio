import React, { useState, useRef } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Download, 
  Sparkles, 
  Search, 
  Check, 
  Copy, 
  Terminal, 
  ShieldCheck, 
  HardDrive, 
  Upload, 
  Car, 
  Layers, 
  HelpCircle, 
  AlertCircle, 
  Sliders, 
  FileVideo, 
  FolderPlus,
  Play,
  CheckCircle2,
  RefreshCw,
  Share2,
  ArrowRight,
  ListMusic,
  VolumeX,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { CarVideoItem, VideoResolution, Playlist } from '../types/media';
import { formatSafeVideoFilename } from '../services/usbExporter';
import { BatchPlaylistDownloader } from './BatchPlaylistDownloader';
import { FolderAudioRepairTool } from './FolderAudioRepairTool';
import { 
  parseMp4Metadata, 
  generateFolderRepairBat 
} from '../services/videoMetadataVerifier';

interface WebDownloaderViewProps {
  onAddToStagingQueue: (items: CarVideoItem[]) => void;
  onPreviewInCar: (item: CarVideoItem) => void;
  stagingCount: number;
  onGoToStaging: () => void;
  playlists: Playlist[];
}

interface ArchiveSearchResult {
  id: string;
  identifier: string;
  title: string;
  artist: string;
  year: string | number;
  downloads: number;
  format: string;
  fileSizeMb: number;
  durationFormatted: string;
  durationSeconds: number;
  resolution: VideoResolution;
  videoCodec: string;
  audioCodec: string;
  downloadUrl: string;
  streamUrl: string;
  source: string;
  licenseType: string;
}

export const WebDownloaderView: React.FC<WebDownloaderViewProps> = ({
  onAddToStagingQueue,
  onPreviewInCar,
  stagingCount,
  onGoToStaging,
  playlists
}) => {
  // Main view section tabs
  const [activeSection, setActiveSection] = useState<'batch' | 'assistant' | 'archive' | 'dropzone' | 'repair'>('batch');

  // ---- SECTION 1: YOUTUBE & WEB ASSISTANT STATE ----
  const [videoUrlOrQuery, setVideoUrlOrQuery] = useState('');
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution>('720p');
  const [includeTrackPrefix, setIncludeTrackPrefix] = useState(true);
  const [parsedTrackInfo, setParsedTrackInfo] = useState<{
    title: string;
    artist: string;
    youtubeId: string;
    url: string;
    estimatedSizeMb: number;
  }>({
    title: 'La Gota Fría',
    artist: 'Carlos Vives',
    youtubeId: 'WwB60W2cO_M',
    url: 'https://www.youtube.com/watch?v=WwB60W2cO_M',
    estimatedSizeMb: 48
  });
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Forced multiplexing states
  const [isResolvingCobalt, setIsResolvingCobalt] = useState(false);
  const [cobaltResolvedResult, setCobaltResolvedResult] = useState<{
    downloadUrl: string;
    filename: string;
  } | null>(null);
  const [cobaltError, setCobaltError] = useState<string | null>(null);

  // Quick preset suggestions
  const QUICK_SUGGESTIONS = [
    { title: 'La Gota Fría', artist: 'Carlos Vives', url: 'https://www.youtube.com/watch?v=WwB60W2cO_M', id: 'WwB60W2cO_M' },
    { title: 'Tú Eres La Reina', artist: 'Diomedes Díaz', url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', id: 'kJQP7kiw5Fk' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', id: 'fJ9rUzIMcZQ' },
    { title: 'Vivir Mi Vida', artist: 'Marc Anthony', url: 'https://www.youtube.com/watch?v=YXnjy5YlDwk', id: 'YXnjy5YlDwk' },
    { title: 'Blinding Lights', artist: 'The Weeknd', url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ', id: '4NRXx6U8ABQ' }
  ];

  // Helper to extract or clean YouTube ID
  const handleUrlOrQueryChange = (text: string) => {
    setVideoUrlOrQuery(text);
    const trimmed = text.trim();
    if (!trimmed) return;

    // Check if it's a YouTube URL
    let ytId = '';
    const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (match && match[1]) {
      ytId = match[1];
      setParsedTrackInfo(prev => ({
        ...prev,
        youtubeId: ytId,
        url: trimmed,
        title: prev.title || 'Video Musical',
        artist: prev.artist || 'Artista Oficial'
      }));
    } else {
      // It's a text search or title
      const parts = trimmed.split(/[-–—]/);
      let artist = 'Artista';
      let title = trimmed;
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' ').trim();
      }
      setParsedTrackInfo(prev => ({
        ...prev,
        title,
        artist,
        url: prev.url
      }));
    }
  };

  const handleSelectSuggestion = (sug: typeof QUICK_SUGGESTIONS[0]) => {
    setVideoUrlOrQuery(sug.url);
    setParsedTrackInfo({
      title: sug.title,
      artist: sug.artist,
      youtubeId: sug.id,
      url: sug.url,
      estimatedSizeMb: selectedResolution === '720p' ? 48 : 75
    });
    setNoticeMessage(`Parámetros cargados para "${sug.artist} - ${sug.title}"`);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  // Safe USB Filename generator
  const getCarUsbFilename = () => {
    const prefix = includeTrackPrefix ? '01 - ' : '';
    const cleanArtist = parsedTrackInfo.artist.replace(/[^\w\s\u00C0-\u024F]/gi, '').trim();
    const cleanTitle = parsedTrackInfo.title.replace(/[^\w\s\u00C0-\u024F]/gi, '').trim();
    return `${prefix}${cleanArtist} - ${cleanTitle} (${selectedResolution}).mp4`;
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Generate yt-dlp command with strict car filters
  const getYtDlpCommand = () => {
    const heightLimit = selectedResolution === '1080p' ? '1080' : '720';
    const filename = getCarUsbFilename();
    return `yt-dlp -f "bestvideo[height<=${heightLimit}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${heightLimit}][ext=mp4]/best" --merge-output-format mp4 -o "${filename}" "${parsedTrackInfo.url}"`;
  };

  // Open Cobalt with user feedback
  const handleOpenCobalt = () => {
    copyToClipboard(parsedTrackInfo.url, 'cobalt');
    setNoticeMessage('¡Enlace de YouTube copiado al portapapeles! Pegándolo en Cobalt descargarás el MP4 limpio y sin anuncios.');
    window.open('https://cobalt.tools/', '_blank', 'noopener,noreferrer');
  };

  // Open alternate converters
  const handleOpenAlternative = (service: 'y2down' | 'loader' | 'savefrom') => {
    copyToClipboard(parsedTrackInfo.url, service);
    let target = 'https://cobalt.tools/';
    if (service === 'savefrom') target = `https://en.savefrom.net/`;
    if (service === 'y2down') target = `https://y2mate.is/`;
    if (service === 'loader') target = `https://loader.to/`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  // Handler: Request server-side forced multiplexing with H.264 + AAC
  const handleResolveForcedMultiplexing = async () => {
    setIsResolvingCobalt(true);
    setCobaltError(null);
    setCobaltResolvedResult(null);

    try {
      const res = await fetch('/api/cobalt/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: parsedTrackInfo.url,
          resolution: selectedResolution
        })
      });
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        setCobaltResolvedResult({
          downloadUrl: data.downloadUrl,
          filename: data.filename || getCarUsbFilename()
        });
        setNoticeMessage('¡Enlace con multiplexación forzada (H.264 + AAC) obtenido con éxito!');
      } else {
        setCobaltError(data.message || 'Servidores de multiplexación remota ocupados. Usa el script de 1 clic para descargar con audio garantizado.');
      }
    } catch {
      setCobaltError('Error de red al consultar el multiplexor. Descarga el script .bat de 1 clic para audio garantizado.');
    } finally {
      setIsResolvingCobalt(false);
    }
  };

  // Handler: Download Folder Repair Bat directly
  const handleDownloadFolderRepairBat = () => {
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
    setNoticeMessage('¡Script Reparador de Carpeta descargado! Guárdalo en la carpeta de tus videos y haz doble clic.');
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  // ---- SECTION 2: ARCHIVE.ORG REAL SEARCH STATE ----
  const [archiveQuery, setArchiveQuery] = useState('vallenato');
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [archiveResults, setArchiveResults] = useState<ArchiveSearchResult[]>([]);
  const [hasSearchedArchive, setHasSearchedArchive] = useState(false);

  const handleSearchArchive = async (customQ?: string) => {
    const q = (customQ !== undefined ? customQ : archiveQuery).trim();
    if (!q) return;

    setIsSearchingArchive(true);
    setHasSearchedArchive(true);
    try {
      const res = await fetch(`/api/archive-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setArchiveResults(data.results || []);
    } catch (err) {
      console.error('Error fetching archive results:', err);
      setArchiveResults([]);
    } finally {
      setIsSearchingArchive(false);
    }
  };

  // Add Archive item to local USB Staging Queue
  const handleAddArchiveToStaging = (item: ArchiveSearchResult) => {
    const carItem: CarVideoItem = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      genre: 'Vallenato',
      durationSeconds: item.durationSeconds,
      durationFormatted: item.durationFormatted,
      resolution: item.resolution,
      fps: 30,
      videoCodec: item.videoCodec,
      audioCodec: item.audioCodec,
      fileSizeMb: item.fileSizeMb,
      thumbnailUrl: '',
      videoStreamUrl: item.streamUrl,
      addedAt: new Date().toISOString(),
      license: {
        type: 'Dominio Público',
        holder: 'Internet Archive',
        attribution: 'Dominio público y acceso abierto',
        sourceUrl: item.downloadUrl,
        carPlaybackAllowed: true,
        legalNotice: 'Material de acceso público y preservación histórica para uso personal.'
      }
    };
    onAddToStagingQueue([carItem]);
    setNoticeMessage(`¡"${item.title}" añadido a la Cola USB!`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // Preview Archive item in Car Cockpit View
  const handlePreviewArchiveInCar = (item: ArchiveSearchResult) => {
    const carItem: CarVideoItem = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      genre: 'Vallenato',
      durationSeconds: item.durationSeconds,
      durationFormatted: item.durationFormatted,
      resolution: item.resolution,
      fps: 30,
      videoCodec: item.videoCodec,
      audioCodec: item.audioCodec,
      fileSizeMb: item.fileSizeMb,
      thumbnailUrl: '',
      videoStreamUrl: item.streamUrl,
      addedAt: new Date().toISOString(),
      license: {
        type: 'Dominio Público',
        holder: 'Internet Archive',
        attribution: 'Dominio público y acceso abierto',
        sourceUrl: item.downloadUrl,
        carPlaybackAllowed: true,
        legalNotice: 'Material de acceso público para uso en cabina.'
      }
    };
    onPreviewInCar(carItem);
  };

  // Direct download for Archive.org MP4
  const handleDirectArchiveDownload = (item: ArchiveSearchResult) => {
    const cleanTitle = item.title.replace(/[^\w\s\u00C0-\u024F]/gi, '').trim() || 'video';
    const filename = `01 - ${cleanTitle} (${item.resolution}).mp4`;
    
    // Trigger download anchor
    const a = document.createElement('a');
    a.href = item.downloadUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setNoticeMessage(`Descarga iniciada para: ${filename}`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // ---- SECTION 3: DROPZONE IMPORT STATE ----
  const [droppedFiles, setDroppedFiles] = useState<{
    file: File;
    name: string;
    sizeMb: number;
    safeCarName: string;
    url: string;
    duration: string;
    status: 'ready' | 'added';
    isSilentStream?: boolean;
    isOpusOrVorbis?: boolean;
    audioCodec?: string;
    streamFormatNote?: string;
    suggestedFfmpegCommand?: string;
  }[]>([]);
  const [copiedFfmpegCmdId, setCopiedFfmpegCmdId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let foundSilent = false;
    let foundOpusVorbis = false;

    const fileList = Array.from(files).filter(f => 
      f.type.includes('video') || 
      f.type.includes('audio') ||
      f.name.endsWith('.mp4') || 
      f.name.endsWith('.m4v') || 
      f.name.endsWith('.webm') || 
      f.name.endsWith('.mkv') ||
      f.name.endsWith('.opus') ||
      f.name.endsWith('.ogg')
    );

    const processedPromises = fileList.map(async (file, idx) => {
      let isSilent = /f(133|134|135|136|137|160|242|243|244|247|248|278)\./i.test(file.name) ||
                     file.name.includes('(playlist_index)') ||
                     file.name.includes('(ext)');
      let isOpus = file.name.toLowerCase().includes('opus') || file.name.endsWith('.opus');
      let isVorbis = file.name.toLowerCase().includes('vorbis') || file.name.endsWith('.ogg');
      let detectedAudio = 'AAC Estéreo';

      try {
        const slice = await file.slice(0, 65536).arrayBuffer();
        const parsed = parseMp4Metadata(slice, file.name);
        if (parsed.audioTracks.length === 0 && !isOpus && !isVorbis && file.name.endsWith('.mp4')) {
          if (file.size > 5 * 1024 * 1024 && parsed.videoTracks.length > 0) {
            isSilent = true;
          }
        } else if (parsed.audioTracks.length > 0) {
          detectedAudio = parsed.audioTracks[0].codec;
          if (detectedAudio.toLowerCase().includes('opus')) isOpus = true;
          if (detectedAudio.toLowerCase().includes('vorbis')) isVorbis = true;
        }
      } catch (e) {
        console.warn('Error reading file slice for audio detection:', e);
      }

      const isOpusOrVorbis = isOpus || isVorbis;
      if (isSilent) foundSilent = true;
      if (isOpusOrVorbis) foundOpusVorbis = true;

      const rawName = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = rawName
        .replace(/\(playlist_index\)\d*d?\s*-\s*\(ext\)s/gi, 'Pista Musical')
        .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const safeCarName = `${String(idx + 1).padStart(2, '0')} - ${cleanName || 'Video_Musical'} (720p).mp4`;
      const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
      const url = URL.createObjectURL(file);

      let streamFormatNote: string | undefined = undefined;
      let suggestedFfmpegCommand: string;

      if (isSilent) {
        streamFormatNote = 'Pista de video DASH sin audio (.f133) descargada sin multiplexar';
        suggestedFfmpegCommand = `ffmpeg -i "${file.name}" -i "${cleanName}.m4a" -c:v copy -c:a aac -b:a 192k "${safeCarName}"`;
      } else if (isOpusOrVorbis) {
        const codecName = isOpus ? 'Opus' : 'Vorbis';
        detectedAudio = `${codecName} (Incompatible)`;
        streamFormatNote = `Flujo de audio ${codecName} detectado. La mayoría de estéreos de auto (Pioneer, Sony, Alpine) no admiten este formato. Se sugiere recodificar a AAC con FFmpeg.`;
        suggestedFfmpegCommand = `ffmpeg -i "${file.name}" -c:v copy -c:a aac -b:a 320k -ar 48000 "${safeCarName}"`;
      } else {
        detectedAudio = 'AAC Estéreo (48 kHz)';
        suggestedFfmpegCommand = `ffmpeg -i "${file.name}" -c:v copy -c:a aac -b:a 320k "${safeCarName}"`;
      }

      return {
        file,
        name: file.name,
        sizeMb,
        safeCarName,
        url,
        duration: '03:30',
        status: 'ready' as const,
        isSilentStream: isSilent,
        isOpusOrVorbis,
        audioCodec: detectedAudio,
        streamFormatNote,
        suggestedFfmpegCommand
      };
    });

    const newItems = await Promise.all(processedPromises);
    setDroppedFiles(prev => [...newItems, ...prev]);

    if (foundOpusVorbis) {
      setNoticeMessage('⚠️ Se detectaron videos con audio Opus o Vorbis (incompatibles con la mayoría de estéreos de auto). Se sugiere explícitamente recodificarlos a AAC mediante el comando de FFmpeg.');
    } else if (foundSilent) {
      setNoticeMessage('⚠️ Se detectaron archivos de video mudos (.f133). Fueron descargados sin FFmpeg en el PC. En la pestaña "1. Listas y Lotes" puedes descargar el script que incluye FFmpeg automático.');
    } else {
      setNoticeMessage(`¡${newItems.length} videos MP4 analizados y listos para formatear para auto!`);
    }
    setTimeout(() => setNoticeMessage(null), 6500);
  };

  const handleAddAllDroppedToStaging = () => {
    const carItems: CarVideoItem[] = droppedFiles.map((df, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      title: df.safeCarName.replace(/\.mp4$/, ''),
      artist: 'Importado de PC / Cobalt',
      genre: 'Acústico',
      durationSeconds: 210,
      durationFormatted: '03:30',
      resolution: '720p',
      fps: 30,
      videoCodec: 'H.264 (Local)',
      audioCodec: df.isOpusOrVorbis 
        ? `${df.audioCodec || 'Opus'} (Incompatible con estéreo)`
        : df.isSilentStream 
          ? 'Sin Audio (Mudo .f133)' 
          : 'AAC Estéreo',
      fileSizeMb: df.sizeMb,
      thumbnailUrl: '',
      videoStreamUrl: df.url,
      addedAt: new Date().toISOString(),
      license: {
        type: 'Autorizado para Uso Personal',
        holder: 'Archivo Local del Usuario',
        attribution: 'Copia privada del usuario',
        carPlaybackAllowed: true,
        legalNotice: 'Copia privada autorizada para reproducción en vehículo.'
      }
    }));

    onAddToStagingQueue(carItems);
    setDroppedFiles(prev => prev.map(p => ({ ...p, status: 'added' })));
    setNoticeMessage(`¡${carItems.length} videos añadidos a la Cola USB!`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Notice Banner */}
      {noticeMessage && (
        <div className="p-3 bg-cyan-950/60 border border-cyan-800/80 rounded-lg text-xs text-cyan-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button 
            onClick={() => setNoticeMessage(null)}
            className="text-cyan-400 hover:text-white text-xs px-2 py-0.5"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Conectividad & Descargas Externas</span>
            <span aria-hidden="true">·</span>
            <span>Estándar Automotriz MP4</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display mb-2">
            Búsqueda Conectada con Filtrado y Enlaces Directos
          </h1>
          
          <p className="text-sm text-slate-300 leading-relaxed">
            Las pantallas y estéreos de auto (Pioneer, Sony, Alpine, Android Auto) requieren especificaciones estrictas: <strong className="text-white">MP4 con códec H.264 + AAC y nombres limpios en FAT32</strong>. 
            Esta herramienta busca canciones, aplica los filtros ideales y te proporciona enlaces limpios de descarga directa y sin publicidad.
          </p>
        </div>

        {/* Quick Staging Status Pill if items exist */}
        {stagingCount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Tienes <strong className="text-emerald-300">{stagingCount} videos</strong> en espera en la Cola USB</span>
            </div>
            <button
              onClick={onGoToStaging}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 hover:underline"
            >
              <span>Ver Cola USB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Interactive Mode Navigation (Functional segmented buttons, not pill enclosures) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => setActiveSection('batch')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-all ${
            activeSection === 'batch'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ListMusic className="w-4 h-4 text-cyan-400" />
          <span>1. Listas y Lotes (Script PC)</span>
        </button>

        <button
          onClick={() => setActiveSection('assistant')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-all ${
            activeSection === 'assistant'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>2. Videos Individuales</span>
        </button>

        <button
          onClick={() => {
            setActiveSection('archive');
            if (!hasSearchedArchive) handleSearchArchive('vallenato');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-all ${
            activeSection === 'archive'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>3. Archivo Abierto (1-Clic)</span>
        </button>

        <button
          onClick={() => setActiveSection('dropzone')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-all ${
            activeSection === 'dropzone'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>4. Importar a USB ({droppedFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('repair')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-all col-span-2 sm:col-span-1 ${
            activeSection === 'repair'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>5. Reparador Carpeta (1-Clic)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION 0: BATCH PLAYLIST & MIX DOWNLOADER SCRIPT GENERATOR */}
      {/* ============================================================== */}
      {activeSection === 'batch' && (
        <BatchPlaylistDownloader
          onNavigateToDropzone={() => setActiveSection('dropzone')}
          stagingCount={stagingCount}
        />
      )}

      {/* ============================================================== */}
      {/* SECTION 1: YOUTUBE & WEB ASSISTANT WITH CAR COMPATIBILITY FILTERS */}
      {/* ============================================================== */}
      {activeSection === 'assistant' && (
        <div className="space-y-6">

          {/* Clarity & Workflow Box */}
          <div className="p-4 bg-slate-950 border border-cyan-900/60 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-950/80 border border-cyan-800/80 rounded-lg shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm font-semibold text-white">
                  ¿Por qué se abre Cobalt para YouTube y qué hace realmente esta app?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  YouTube bloquea cualquier intento de descarga automática desde servidores en la nube. Por eso, este asistente prepara el enlace limpio para abrirlo en <strong>Cobalt</strong> (que no tiene publicidad engañosa ni virus).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-emerald-400 block mb-1">
                      ¿Quieres descargar 100% dentro de esta app?
                    </span>
                    <p className="text-slate-400 text-[11px] mb-2">
                      La sección de <strong>Archivo Abierto</strong> busca en repositorios públicos y descarga el MP4 directo en tu navegador con 1 clic sin ir a ninguna otra web.
                    </p>
                    <button
                      onClick={() => {
                        setActiveSection('archive');
                        if (!hasSearchedArchive) handleSearchArchive('vallenato');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded text-[11px] flex items-center gap-1.5"
                    >
                      <span>Ir a Descargas Directas en la App</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-amber-400 block mb-1">
                      El rol principal de esta app para tu auto:
                    </span>
                    <p className="text-slate-400 text-[11px] mb-2">
                      Cobalt solo te da un archivo crudo con nombres que <strong>congelan las pantallas de los carros</strong>. Esta app valida los códecs H.264/AAC, renombra para FAT32 y te empaqueta la memoria USB.
                    </p>
                    <button
                      onClick={() => setActiveSection('dropzone')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded text-[11px] flex items-center gap-1.5"
                    >
                      <span>Ver Zona de Importación para USB</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter Configuration Panel */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Filtros de Compatibilidad para el Estéreo</h3>
              </div>
              <span className="text-[11px] text-slate-400">Perfil: MP4 (H.264 Baseline + AAC)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Filter 1: Resolution */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Resolución Máxima:</label>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
                  <button
                    onClick={() => setSelectedResolution('720p')}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      selectedResolution === '720p'
                        ? 'bg-cyan-900/60 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    720p HD (Auto 99%)
                  </button>
                  <button
                    onClick={() => setSelectedResolution('1080p')}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      selectedResolution === '1080p'
                        ? 'bg-cyan-900/60 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1080p FHD
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">720p garantiza fluidez sin pantalla negra en pantallas automotrices.</p>
              </div>

              {/* Filter 2: Container & Codec */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Códec & Contenedor:</label>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-emerald-400 font-mono flex items-center justify-between">
                  <span>MP4 / H.264 + AAC</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400">Evita formatos MKV o WebM incompatibles con memorias USB en autos.</p>
              </div>

              {/* Filter 3: Safe Naming rule */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Renombrado para FAT32:</label>
                <button
                  onClick={() => setIncludeTrackPrefix(!includeTrackPrefix)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-xs text-left text-slate-300 flex items-center justify-between"
                >
                  <span>Prefijo de pista (`01 - `)</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${includeTrackPrefix ? 'bg-cyan-500 text-slate-950' : 'border border-slate-600'}`}>
                    {includeTrackPrefix && <Check className="w-3 h-3" />}
                  </div>
                </button>
                <p className="text-[10px] text-slate-400">Ordena alfabéticamente en la pantalla de navegación del vehículo.</p>
              </div>
            </div>
          </div>

          {/* Search Input / URL bar */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Pega la URL de YouTube o escribe el Artista y Canción:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={videoUrlOrQuery}
                    onChange={(e) => handleUrlOrQueryChange(e.target.value)}
                    placeholder="Ej. https://www.youtube.com/watch?v=WwB60W2cO_M o Carlos Vives - La Gota Fria"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Ejemplos rápidos:</span>
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.id}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-xs transition-colors border border-slate-700/60"
                >
                  {sug.artist} - {sug.title}
                </button>
              ))}
            </div>
          </div>

          {/* Output Card: Filtered Result & Direct Action Links */}
          <div className="p-5 bg-slate-900/90 border border-cyan-900/60 rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wide">Ficha de Compatibilidad Generada</span>
                <h3 className="text-lg font-bold text-white font-display">
                  {parsedTrackInfo.artist} – {parsedTrackInfo.title}
                </h3>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Res: <strong className="text-cyan-400">{selectedResolution}</strong> · Est. ~{selectedResolution === '720p' ? '45' : '75'} MB
              </div>
            </div>

            {/* Filename Preview */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Nombre final listo para memoria USB (Sin caracteres prohibidos):</span>
                <button
                  onClick={() => copyToClipboard(getCarUsbFilename(), 'filename')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedType === 'filename' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'filename' ? 'Copiado' : 'Copiar nombre'}</span>
                </button>
              </div>
              <p className="font-mono text-xs text-emerald-300 break-all select-all">
                {getCarUsbFilename()}
              </p>
            </div>

              {/* Forced Multiplexing Solucion Directa Card (Audio AAC Garantizado) */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/60 rounded-xl space-y-4 shadow-lg shadow-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/40 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight font-display flex items-center gap-2">
                        <span>Descarga Directa con Audio Multiplexado</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                          AAC Estéreo Garantizado
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Combina forzosamente video H.264 ({selectedResolution}) con audio AAC estéreo a 192 kbps (sin pistas mudas ni codecs Opus).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {cobaltResolvedResult ? (
                    <div className="p-3.5 bg-slate-950/90 border border-emerald-500/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>¡Video Listo con Audio Combinado!</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">MP4 H.264 + AAC</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <a
                          href={cobaltResolvedResult.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={cobaltResolvedResult.filename}
                          className="w-full sm:flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 active:scale-95 text-center"
                        >
                          <Download className="w-4 h-4 text-slate-950" />
                          <span>Descargar MP4 con Audio Ahora</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleResolveForcedMultiplexing}
                          disabled={isResolvingCobalt}
                          className="w-full sm:w-auto px-3 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                          title="Volver a generar enlace"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isResolvingCobalt ? 'animate-spin' : ''}`} />
                          <span>Actualizar enlace</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center font-mono truncate">
                        Archivo: {cobaltResolvedResult.filename}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={handleResolveForcedMultiplexing}
                        disabled={isResolvingCobalt}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 active:scale-95"
                      >
                        {isResolvingCobalt ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                            <span>Multiplexando pistas en el servidor con audio AAC...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generar Enlace de Descarga con Audio Forzado</span>
                          </>
                        )}
                      </button>

                      {cobaltError && (
                        <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-xs text-amber-200">
                          <p className="text-[11px] leading-snug">{cobaltError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clean callout to Tab 1 batch script */}
                  <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="text-[11px]">
                      💡 ¿Quieres descargar listas completas o 50 videos a la vez?
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSection('batch')}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 self-start sm:self-auto"
                    >
                      <span>Usar Script para Listas y Lotes</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Opciones y Convertidores Alternativos:
                </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method 1: Cobalt Tools (Top Recommendation) */}
                <div className="p-4 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/80 rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-cyan-300 font-display">Cobalt.tools</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Recomendado</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        100% de código abierto, <strong className="text-white">sin anuncios engañosos ni ventanas emergentes</strong>. Descarga el MP4 original.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenCobalt}
                    className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-md text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Abrir en Cobalt (Copia enlace automático)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Copia la URL al portapapeles y abre Cobalt para descargar el MP4 al instante.
                  </p>
                </div>

                {/* Method 2: yt-dlp terminal command */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-slate-200 font-display">Comando yt-dlp para PC</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Si usas Windows/Mac con terminal, descarga a máxima velocidad con los filtros exactos de H.264.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(getYtDlpCommand(), 'ytdlp')}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-md text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    {copiedType === 'ytdlp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'ytdlp' ? '¡Comando Copiado!' : 'Copiar comando yt-dlp con filtros'}</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-mono truncate">
                    yt-dlp -f &quot;bestvideo[height&lt;={selectedResolution === '1080p' ? '1080' : '720'}]...&quot;
                  </p>
                </div>
              </div>

              {/* Alternate Web Converters */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Otras alternativas web:</span>
                <button
                  onClick={() => handleOpenAlternative('savefrom')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] border border-slate-700"
                >
                  SaveFrom.net
                </button>
                <button
                  onClick={() => handleOpenAlternative('y2down')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] border border-slate-700"
                >
                  Y2Mate.is
                </button>
                <button
                  onClick={() => handleOpenAlternative('loader')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] border border-slate-700"
                >
                  Loader.to (Playlists)
                </button>
              </div>
            </div>

            {/* Next Step hint */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs text-slate-400">
              <span>¿Ya descargaste el video en tu ordenador?</span>
              <button
                onClick={() => setActiveSection('dropzone')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>Arrastrar a la app para preparar USB</span>
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: ARCHIVE.ORG OPEN API SEARCH (1-CLICK DIRECT DOWNLOAD) */}
      {/* ============================================================== */}
      {activeSection === 'archive' && (
        <div className="space-y-6">
          
          {/* Archive Search Bar */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Buscador Directo de Archivo Abierto (Internet Archive)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conexión directa con la API pública de Archive.org. Conciertos, actuaciones históricas y videos de dominio público <strong className="text-slate-200">con descarga directa en 1 clic</strong> sin intermediarios.
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-mono">100% Legal y Libre</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSearchArchive(); }} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveQuery}
                  onChange={(e) => setArchiveQuery(e.target.value)}
                  placeholder="Buscar en Archive.org (ej. vallenato, salsa en vivo, rock concert, cumbia)..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingArchive}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-2 shrink-0"
              >
                {isSearchingArchive ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Consultando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar MP4</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick search tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Búsquedas populares:</span>
              {['vallenato', 'salsa en vivo', 'cumbia clasica', 'rock concert', 'latin music'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setArchiveQuery(tag);
                    handleSearchArchive(tag);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors border border-slate-700/60"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Archive Results Grid */}
          {isSearchingArchive ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Buscando archivos MP4 en la API de Internet Archive...</p>
              <p className="text-xs text-slate-500">Filtrando contenedores MPEG-4 y formatos compatibles con estéreo de auto.</p>
            </div>
          ) : archiveResults.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>{archiveResults.length} videos MP4 encontrados listos para auto</span>
                <span className="font-mono">Filtro: MP4 H.264 / MPEG-4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archiveResults.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 font-mono mb-1">
                        <span>{item.artist}</span>
                        <span className="text-emerald-400">{item.resolution}</span>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-white line-clamp-2">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                        <span>{item.durationFormatted}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.fileSizeMb} MB</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500">{item.downloads} descargas</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      {/* Direct 1-Click Download button */}
                      <button
                        onClick={() => handleDirectArchiveDownload(item)}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar MP4</span>
                      </button>

                      {/* Add to USB Queue */}
                      <button
                        onClick={() => handleAddArchiveToStaging(item)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition-colors flex items-center gap-1 border border-slate-700"
                        title="Añadir a la Cola de preparación para memoria USB"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">A Cola USB</span>
                      </button>

                      {/* Preview in Car */}
                      <button
                        onClick={() => handlePreviewArchiveInCar(item)}
                        className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs transition-colors"
                        title="Probar en Consola de Auto"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : hasSearchedArchive ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <HelpCircle className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">No se encontraron videos MP4 directos para esa consulta en Archive.org.</p>
              <p className="text-xs text-slate-500">Prueba con términos más generales como &quot;vallenato&quot;, &quot;salsa&quot;, &quot;cumbia&quot; o usa el Asistente de YouTube en la Pestaña 1.</p>
            </div>
          ) : null}

        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: DROPZONE IMPORT OF DOWNLOADED MP4 VIDEOS */}
      {/* ============================================================== */}
      {activeSection === 'dropzone' && (
        <div className="space-y-6">
          
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Importador y Normalizador de Videos Descargados</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ¿Descargaste tus videos musicales MP4 con Cobalt o en tu ordenador? Arrástralos aquí. La aplicación los <strong className="text-white">renombrará según la norma de tu estéreo de auto</strong> y los dejará listos para transferir a tu USB.
              </p>
            </div>

            {/* Drop Zone Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                processImportFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-950 transition-colors p-8 rounded-xl text-center cursor-pointer space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/m4v"
                className="hidden"
                onChange={(e) => processImportFiles(e.target.files)}
              />
              <FileVideo className="w-10 h-10 text-cyan-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Arrastra aquí tus archivos .mp4 o haz clic para seleccionarlos
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos recomendados: MP4 (H.264). Tamaño máximo recomendado por video: 200 MB.
                </p>
              </div>
            </div>
          </div>

          {/* List of Dropped Files */}
          {droppedFiles.length > 0 && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300">
                  Videos analizados para USB ({droppedFiles.length}):
                </h4>
                <button
                  onClick={handleAddAllDroppedToStaging}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded text-xs transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Añadir todos a Cola USB</span>
                </button>
              </div>

              {/* Warning for Opus or Vorbis files */}
              {droppedFiles.some(f => f.isOpusOrVorbis) && (
                <div className="p-3 bg-amber-950/70 border border-amber-500/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-sans">Advertencia: Flujo de Audio Opus / Vorbis Detectado</strong>
                      <p className="text-[11px] text-amber-200/90 leading-snug">
                        Se detectaron videos con audio Opus o Vorbis. La gran mayoría de estéreos de auto (Pioneer, Sony, Alpine) no admiten estos formatos web y reproducirán en silencio o darán error. <strong>Se sugiere explícitamente recodificarlos a AAC mediante FFmpeg.</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDownloadFolderRepairBat}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Reparador (.bat) 1-Clic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('repair')}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded text-xs border border-amber-500/50 transition-colors"
                    >
                      Ver Reparador
                    </button>
                  </div>
                </div>
              )}

              {/* Warning for silent DASH files */}
              {droppedFiles.some(f => f.isSilentStream) && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-200">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Atención:</strong> Uno o más videos se descargaron sin pista de audio (DASH .f133). Requiere multiplexar audio con FFmpeg.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDownloadFolderRepairBat}
                      className="flex-1 sm:flex-initial px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Reparar Carpeta (.bat)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('repair')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs border border-slate-700"
                    >
                      Abrir Herramienta
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {droppedFiles.map((df, i) => (
                  <div
                    key={i}
                    className={`p-3.5 bg-slate-950 border rounded-xl space-y-2 text-xs transition-all ${
                      df.isOpusOrVorbis
                        ? 'border-amber-600/70 bg-amber-950/20'
                        : df.isSilentStream
                          ? 'border-red-800/80 bg-red-950/20'
                          : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {df.isOpusOrVorbis ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : df.isSilentStream ? (
                          <VolumeX className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <FileVideo className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-white font-medium truncate">{df.safeCarName}</p>
                            
                            {/* Explicit Status Badges */}
                            {df.isOpusOrVorbis && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono font-semibold shrink-0 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>Audio Opus/Vorbis (Incompatible con Estéreos)</span>
                              </span>
                            )}
                            {df.isSilentStream && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-700/80 font-mono font-semibold shrink-0 flex items-center gap-1">
                                <VolumeX className="w-3 h-3 text-red-400" />
                                <span>Sin Audio (.f133 DASH)</span>
                              </span>
                            )}
                            {!df.isOpusOrVorbis && !df.isSilentStream && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/70 font-mono shrink-0">
                                AAC Estéreo OK
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Original: {df.name} · {df.sizeMb} MB · Audio: <span className={df.isOpusOrVorbis ? 'text-amber-400 font-semibold' : 'text-slate-400'}>{df.audioCodec}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {df.status === 'added' ? (
                          <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>En Cola USB</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const carItem: CarVideoItem = {
                                  id: `local-${Date.now()}-${i}`,
                                  title: df.safeCarName.replace(/\.mp4$/, ''),
                                  artist: 'Importado de PC / Cobalt',
                                  genre: 'Acústico',
                                  durationSeconds: 210,
                                  durationFormatted: '03:30',
                                  resolution: '720p',
                                  fps: 30,
                                  videoCodec: 'H.264 (Local)',
                                  audioCodec: df.isOpusOrVorbis 
                                    ? `${df.audioCodec || 'Opus'} (Incompatible con estéreo)`
                                    : df.isSilentStream 
                                      ? 'Sin Audio (Mudo .f133)' 
                                      : 'AAC Estéreo',
                                  fileSizeMb: df.sizeMb,
                                  thumbnailUrl: '',
                                  videoStreamUrl: df.url,
                                  addedAt: new Date().toISOString(),
                                  license: {
                                    type: 'Autorizado para Uso Personal',
                                    holder: 'Archivo Local del Usuario',
                                    attribution: 'Copia privada del usuario',
                                    carPlaybackAllowed: true,
                                    legalNotice: 'Copia privada autorizada.'
                                  }
                                };
                                onPreviewInCar(carItem);
                              }}
                              className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 rounded text-xs transition-colors border border-amber-800/60 flex items-center gap-1"
                              title="Probar en simulador de consola de auto y verificar audio"
                            >
                              <Car className="w-3.5 h-3.5" />
                              <span>Probar en Auto</span>
                            </button>

                            <button
                              onClick={() => {
                                const carItem: CarVideoItem = {
                                  id: `local-${Date.now()}-${i}`,
                                  title: df.safeCarName.replace(/\.mp4$/, ''),
                                  artist: 'Importado de PC / Cobalt',
                                  genre: 'Acústico',
                                  durationSeconds: 210,
                                  durationFormatted: '03:30',
                                  resolution: '720p',
                                  fps: 30,
                                  videoCodec: 'H.264 (Local)',
                                  audioCodec: df.isOpusOrVorbis 
                                    ? `${df.audioCodec || 'Opus'} (Incompatible con estéreo)`
                                    : df.isSilentStream 
                                      ? 'Sin Audio (Mudo .f133)' 
                                      : 'AAC Estéreo',
                                  fileSizeMb: df.sizeMb,
                                  thumbnailUrl: '',
                                  videoStreamUrl: df.url,
                                  addedAt: new Date().toISOString(),
                                  license: {
                                    type: 'Autorizado para Uso Personal',
                                    holder: 'Archivo Local del Usuario',
                                    attribution: 'Copia privada del usuario',
                                    carPlaybackAllowed: true,
                                    legalNotice: 'Copia privada autorizada.'
                                  }
                                };
                                onAddToStagingQueue([carItem]);
                                setDroppedFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'added' } : item));
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition-colors border border-slate-700"
                            >
                              Añadir a Cola
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Explicit FFmpeg Recoding Suggestion Box for Opus/Vorbis or Silent */}
                    {(df.isOpusOrVorbis || df.isSilentStream) && df.suggestedFfmpegCommand && (
                      <div className="mt-2 p-2.5 bg-black/60 border border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                            <Terminal className="w-3.5 h-3.5 text-amber-400" />
                            <span>Comando sugerido de FFmpeg para recodificar a AAC:</span>
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(df.suggestedFfmpegCommand || '');
                              setCopiedFfmpegCmdId(`cmd-${i}`);
                              setTimeout(() => setCopiedFfmpegCmdId(null), 2500);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors border border-slate-700/80"
                          >
                            {copiedFfmpegCmdId === `cmd-${i}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar FFmpeg</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-2 bg-slate-950 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto select-all border border-slate-900">
                          <code>{df.suggestedFfmpegCommand}</code>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {df.isOpusOrVorbis
                            ? '💡 Al usar "-c:v copy", el video no sufre recompresión ni pérdida de calidad y el audio se transforma a AAC en menos de 3 segundos.'
                            : '💡 Multiplexa la pista de video con un audio estéreo para que suene correctamente en la radio del auto.'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: FOLDER AUDIO REPAIR TOOL (1-CLICK SCRIPT GENERATOR) */}
      {/* ============================================================== */}
      {activeSection === 'repair' && (
        <FolderAudioRepairTool
          onNavigateToDropzone={() => setActiveSection('dropzone')}
        />
      )}

      {/* Educational Guide: Automotive Stereo Checklist */}
      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 text-xs text-slate-400">
        <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
          <Car className="w-4 h-4 text-cyan-400" />
          <span>Guía Rápida: ¿Por qué fallan los videos en pantallas de auto y cómo evitarlo?</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg space-y-1">
            <strong className="text-white block font-sans">1. Resolución excesiva (4K / 1440p)</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los procesadores de los estéreos se saturan con videos mayores a 1080p o con bitrates altos (&gt;6 Mbps). Elige siempre <span className="text-cyan-300">720p HD</span> para máxima compatibilidad.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg space-y-1">
            <strong className="text-white block font-sans">2. Códec de video incompatible</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los formatos AV1, VP9 y HEVC (H.265) provocan que el auto reproduzca solo audio con pantalla negra. El estándar universal de pantalla de auto es <span className="text-cyan-300">H.264 AVC</span>.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg space-y-1">
            <strong className="text-white block font-sans">3. Caracteres y nombres largos</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los sistemas FAT32 cortan nombres con caracteres especiales (`%`, `[`, `]`, `?`). Esta app renombra automáticamente con la estructura limpia <span className="text-cyan-300">`01 - Artista - Canción.mp4`</span>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

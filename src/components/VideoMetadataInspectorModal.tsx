import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  VolumeX, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Download, 
  Upload, 
  RefreshCw, 
  Film, 
  Layers, 
  HelpCircle,
  HardDrive,
  Info,
  Car
} from 'lucide-react';
import { CarVideoItem } from '../types/media';
import { 
  verifyVideoMetadata, 
  VideoMetadataVerificationResult,
  generateFolderRepairBat
} from '../services/videoMetadataVerifier';

interface VideoMetadataInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo: CarVideoItem | null;
  videoElement?: HTMLVideoElement | null;
}

export const VideoMetadataInspectorModal: React.FC<VideoMetadataInspectorModalProps> = ({
  isOpen,
  onClose,
  currentVideo,
  videoElement
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'upload' | 'presets'>('current');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VideoMetadataVerificationResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze the current video whenever modal opens or tab changes to 'current'
  useEffect(() => {
    if (isOpen && currentVideo && activeTab === 'current') {
      analyzeCurrentVideo();
    }
  }, [isOpen, currentVideo?.id, activeTab]);

  const analyzeCurrentVideo = async () => {
    if (!currentVideo) return;
    setIsAnalyzing(true);
    try {
      const res = await verifyVideoMetadata(currentVideo, videoElement);
      setVerificationResult(res);
    } catch (err) {
      console.error('Error verifying video metadata:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsAnalyzing(true);
    try {
      const res = await verifyVideoMetadata(file);
      setVerificationResult(res);
    } catch (err) {
      console.error('Error verifying uploaded file:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePresetSelect = async (presetType: 'silent-dash' | 'opus-unsupported' | 'valid-aac') => {
    setIsAnalyzing(true);
    let mockItem: Partial<CarVideoItem>;

    if (presetType === 'silent-dash') {
      mockItem = {
        title: '01 - Video_Descargado_(playlist_index).f133',
        artist: 'YouTube DASH Video-Only',
        videoCodec: 'H.264 / AVC (avc1)',
        audioCodec: 'Sin Audio (Mudo - Stream .f133)',
        resolution: '720p',
        fileSizeMb: 38.5,
        durationSeconds: 215,
        videoStreamUrl: 'https://example.com/stream.f133.mp4'
      };
    } else if (presetType === 'opus-unsupported') {
      mockItem = {
        title: '02 - Pista_Web_WebM_Opus',
        artist: 'Audio Web Moderno',
        videoCodec: 'VP9 / av01',
        audioCodec: 'Opus (Incompatible con radios de auto antiguas)',
        resolution: '1080p',
        fileSizeMb: 52.0,
        durationSeconds: 198,
        videoStreamUrl: 'https://example.com/opus_stream.webm'
      };
    } else {
      mockItem = {
        title: '03 - La Gota Fria - Carlos Vives (720p)',
        artist: 'Carlos Vives',
        videoCodec: 'H.264 / AVC',
        audioCodec: 'AAC Estéreo (320 kbps - 48 kHz)',
        resolution: '720p',
        fileSizeMb: 48.0,
        durationSeconds: 230,
        videoStreamUrl: '/videos/neon_highway.mp4'
      };
    }

    try {
      const res = await verifyVideoMetadata(mockItem as CarVideoItem);
      setVerificationResult(res);
    } catch (err) {
      console.error('Error verifying preset:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyCommand = () => {
    if (!verificationResult) return;
    navigator.clipboard.writeText(verificationResult.ffmpegCommand);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadBatchScript = () => {
    if (!verificationResult) return;
    const blob = new Blob([verificationResult.windowsBatchScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recodificar_Audio_Auto_${verificationResult.fileName.replace(/\.[^/.]+$/, '')}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFolderRepair = () => {
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">
                  Herramienta de Verificación de Metadatos de Video
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-400">
                  Automotive Audio Inspector v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Análisis de pistas de audio, códecs de contenedor y compatibilidad con consolas de auto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-900/90 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Video en Simulador</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar Archivo de PC (.mp4)</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Casos de Prueba</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'current') analyzeCurrentVideo();
              }}
              disabled={isAnalyzing}
              className="px-2.5 py-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 flex items-center gap-1 text-[11px]"
              title="Volver a analizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Reanalizar</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB CONTENT: UPLOAD PC FILE */}
          {activeTab === 'upload' && (
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 text-center space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.m4v,.mkv,.webm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Selecciona cualquier video descargado en tu PC
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  La herramienta leerá directamente los átomos y metadatos del contenedor MP4 para verificar si contiene pistas de audio válidas antes de copiarlo a la USB del auto.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Explorar Archivo MP4 en PC</span>
              </button>
              {uploadedFileName && (
                <div className="text-xs text-cyan-400 font-mono">
                  Archivo cargado: {uploadedFileName}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handlePresetSelect('silent-dash')}
                className="p-3 text-left rounded-xl border border-red-800/80 bg-red-950/30 hover:bg-red-950/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-1">
                  <VolumeX className="w-4 h-4" />
                  <span>DASH Sin Audio (.f133)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simula la descarga de YouTube que falló al unir el audio. Pistas de audio: 0.
                </p>
              </button>

              <button
                onClick={() => handlePresetSelect('opus-unsupported')}
                className="p-3 text-left rounded-xl border border-amber-800/80 bg-amber-950/30 hover:bg-amber-950/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Audio Opus Web</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simula archivo con audio en formato Opus, incompatible con el 90% de estéreos de auto.
                </p>
              </button>

              <button
                onClick={() => handlePresetSelect('valid-aac')}
                className="p-3 text-left rounded-xl border border-emerald-800/80 bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MP4 + AAC Estéreo</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Archivo 100% estándar. H.264 + AAC-LC 320k 48kHz optimizado para consolas.
                </p>
              </button>
            </div>
          )}

          {/* VERIFICATION REPORT SECTION */}
          {isAnalyzing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-sm font-bold text-white">Analizando estructura de metadatos...</div>
              <div className="text-xs text-slate-400">
                Inspeccionando átomos ISOBMFF: trak, mdia, hdlr (vide/soun) y descripciones stsd
              </div>
            </div>
          ) : verificationResult ? (
            <div className="space-y-6">

              {/* 1. PRIMARY WARNING OR SUCCESS BANNER */}
              {!verificationResult.hasAudioTrack ? (
                /* CRITICAL WARNING: NO AUDIO TRACK DETECTED */
                <div className="p-5 rounded-xl border-2 border-red-500 bg-red-950/60 shadow-lg shadow-red-950/50 space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                      <VolumeX className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500 text-slate-950 font-mono">
                          Advertencia Crítica de Consola
                        </span>
                        <span className="text-xs text-red-300 font-mono">
                          Pistas de Audio: 0 / 1 requerida
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        ¡Este video no tiene ninguna pista de audio válida!
                      </h3>
                      <p className="text-xs text-red-200/90 leading-relaxed">
                        El analizador de metadatos confirmó que el contenedor MP4 solo contiene una pista de video y{' '}
                        <strong>cero pistas de audio</strong>. Si copias este archivo a tu memoria USB,{' '}
                        <strong>la consola del coche reproducirá en silencio total o emitirá un mensaje de "Formato de audio no soportado"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-red-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-red-300">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span><strong>Diagnóstico:</strong> {verificationResult.recodingReason}</span>
                    </div>
                    <span className="text-red-300 font-semibold underline">
                      Requiere recodificación obligatoria para ser compatible con el auto
                    </span>
                  </div>
                </div>
              ) : verificationResult.isOpusOrVorbis ? (
                /* EXPLICIT WARNING: OPUS OR VORBIS CODEC DETECTED */
                <div className="p-5 rounded-xl border-2 border-amber-500 bg-amber-950/70 shadow-lg shadow-amber-950/40 space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 font-mono">
                          Alerta de Incompatibilidad
                        </span>
                        <span className="text-xs text-amber-300 font-mono">
                          Códec Detectado: {verificationResult.audioCodec}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Flujo de audio Opus / Vorbis detectado (Incompatible con la mayoría de estéreos)
                      </h3>
                      <p className="text-xs text-amber-100/90 leading-relaxed">
                        El archivo contiene audio en formato web <strong>{verificationResult.audioCodec}</strong>. La gran mayoría de estéreos y pantallas automotrices (Pioneer, Sony, Alpine, Kenwood, radios OEM) <strong>no pueden decodificar Opus ni Vorbis</strong>, provocando reproducción muda o mensajes de <em>"Error de Códec"</em>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-amber-200">
                      💡 <strong>Sugerencia explícita:</strong> Recodificar la pista de audio a <strong>AAC Estéreo (320 kbps)</strong> mediante FFmpeg usando el comando sugerido a continuación.
                    </span>
                    <button
                      onClick={handleCopyCommand}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm ml-auto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Comando FFmpeg Sugerido</span>
                    </button>
                  </div>
                </div>
              ) : verificationResult.compatibilityStatus === 'warning' ? (
                /* WARNING: UNSUPPORTED AUDIO CODEC */
                <div className="p-5 rounded-xl border-2 border-amber-500 bg-amber-950/60 space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                        Advertencia de Códec de Audio
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Audio detectado con códec no estándar para estéreos de auto
                      </h3>
                      <p className="text-xs text-amber-200/90 mt-1">
                        El video tiene audio ({verificationResult.audioCodec}), pero muchas radios de coche (Pioneer, Sony, Alpine) solo aceptan <strong>AAC-LC</strong> o <strong>MP3</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* SUCCESS: 100% COMPATIBLE WITH CAR CONSOLE */
                <div className="p-4 rounded-xl border border-emerald-500/60 bg-emerald-950/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        Compatible al 100% con la Consola del Coche
                      </div>
                      <div className="text-sm font-bold text-white">
                        Pista de Audio AAC Estéreo y Video H.264 Verificados
                      </div>
                      <div className="text-xs text-slate-400">
                        {verificationResult.audioCodec} · {verificationResult.audioChannels} canales · {verificationResult.audioSampleRate} Hz
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-emerald-400">100%</div>
                    <div className="text-[10px] text-slate-400 font-mono">Índice Consola</div>
                  </div>
                </div>
              )}

              {/* 2. AUTOMOTIVE TELEMETRY CLUSTER (4-CARD GRID) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Metric 1: Audio Tracks */}
                <div className={`p-3.5 rounded-xl border ${
                  verificationResult.hasAudioTrack
                    ? 'border-emerald-800/80 bg-emerald-950/20'
                    : 'border-red-800/80 bg-red-950/30'
                }`}>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Pistas de Audio</span>
                    {verificationResult.hasAudioTrack ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    verificationResult.hasAudioTrack ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {verificationResult.audioTrackCount > 0 ? `${verificationResult.audioTrackCount} Pista` : '0 (Mudo)'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {verificationResult.hasAudioTrack ? 'Presente en MP4' : 'Falta flujo de audio'}
                  </div>
                </div>

                {/* Metric 2: Audio Codec */}
                <div className={`p-3.5 rounded-xl border ${
                  verificationResult.hasAudioTrack
                    ? 'border-slate-800 bg-slate-950/40'
                    : 'border-red-800/80 bg-red-950/30'
                }`}>
                  <div className="text-[11px] text-slate-400 font-medium">Códec de Audio</div>
                  <div className={`text-sm font-bold font-mono mt-1.5 truncate ${
                    verificationResult.hasAudioTrack ? 'text-white' : 'text-red-400'
                  }`}>
                    {verificationResult.audioCodec}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {verificationResult.audioChannels > 0 ? `${verificationResult.audioChannels} Canales · ${verificationResult.audioSampleRate} Hz` : 'Sin decodificador'}
                  </div>
                </div>

                {/* Metric 3: Video Stream */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Pista de Video</span>
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-sm font-bold font-mono text-cyan-400 mt-1.5 truncate">
                    {verificationResult.videoCodec}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {verificationResult.resolution} · {verificationResult.fileSizeMb} MB
                  </div>
                </div>

                {/* Metric 4: Compatibility Score */}
                <div className={`p-3.5 rounded-xl border ${
                  verificationResult.compatibilityScore >= 90
                    ? 'border-emerald-800/80 bg-emerald-950/20'
                    : verificationResult.compatibilityScore >= 50
                    ? 'border-amber-800/80 bg-amber-950/20'
                    : 'border-red-800/80 bg-red-950/30'
                }`}>
                  <div className="text-[11px] text-slate-400 font-medium">Consola de Auto</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    verificationResult.compatibilityScore >= 90
                      ? 'text-emerald-400'
                      : verificationResult.compatibilityScore >= 50
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}>
                    {verificationResult.isCarConsoleCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {verificationResult.requiresRecoding ? 'Requiere recodificación' : 'Listo para USB'}
                  </div>
                </div>

              </div>

              {/* 3. DETAILED TECHNICAL CHECKLIST TABLE */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Desglose de Compatibilidad de Hardware Automotriz
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Norma ISO/IEC 14496-14 (MP4 Audio/Video)
                  </span>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {verificationResult.detailedChecks.map(check => (
                    <div key={check.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {check.status === 'pass' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : check.status === 'warn' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-white">{check.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-6">
                          {check.carImpact}
                        </p>
                      </div>
                      <div className="text-right shrink-0 pl-6 sm:pl-0">
                        <div className={`text-xs font-mono font-bold ${
                          check.status === 'pass'
                            ? 'text-emerald-400'
                            : check.status === 'warn'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}>
                          {check.detected}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Requerido: {check.expected}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. RECODING & FFMPEG SOLUTION GENERATOR */}
              {verificationResult.requiresRecoding && (
                <div className="p-5 rounded-xl border border-cyan-800/60 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-950 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white font-display">
                        Solución: Recodificar con FFmpeg para la Consola del Auto
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-400">
                      100% Automático
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {verificationResult.recodingSolution} Puedes ejecutar este comando en la terminal de tu PC o descargar el script ejecutable para Windows (.bat) que se encarga de todo:
                  </p>

                  {/* Code block */}
                  <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                    <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                      {verificationResult.ffmpegCommand}
                    </pre>
                    <button
                      onClick={handleCopyCommand}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors shadow"
                      title="Copiar comando FFmpeg"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={handleDownloadBatchScript}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Script .BAT para Este Video</span>
                    </button>

                    <button
                      onClick={handleDownloadFolderRepair}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Reparar Carpeta Completa (.bat)</span>
                    </button>

                    <button
                      onClick={handleCopyCommand}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar Comando</span>
                    </button>
                  </div>

                  {/* Educational automotive head unit note */}
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>¿Por qué las pantallas de coche exigen audio AAC en MP4?</span>
                    </div>
                    <p className="leading-snug">
                      Los chips decodificadores de las radios de coche (NXP, Texas Instruments, Rockchip en Android Auto) están diseñados para audio automotriz de baja latencia con códec <strong>AAC-LC</strong>. Si un archivo MP4 no tiene pista de audio, el multiplexor del estéreo no puede sincronizar el reloj de audio (PTS/DTS) y descarta la reproducción sonora.
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : null}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Archivo: <strong>{verificationResult?.fileName || currentVideo?.title || 'Video actual'}</strong></span>
            <span>·</span>
            <span>Analizado: {verificationResult?.analyzedAt || 'Ahora'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Cerrar Inspector
          </button>
        </div>

      </div>
    </div>
  );
};

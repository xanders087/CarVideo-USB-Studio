import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  Maximize2, 
  Sun, 
  Moon, 
  Radio, 
  HardDrive, 
  Gauge, 
  Clock, 
  Thermometer, 
  ListMusic, 
  Download,
  ShieldCheck,
  Tv,
  Youtube,
  Film,
  RefreshCw,
  AlertTriangle,
  X,
  ExternalLink,
  FileCode2,
  CheckCircle2,
  FileCheck2,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import { CarVideoItem } from '../types/media';
import { downloadSingleVideo } from '../services/usbExporter';
import { VideoMetadataInspectorModal } from './VideoMetadataInspectorModal';
import { verifyVideoMetadata, VideoMetadataVerificationResult } from '../services/videoMetadataVerifier';

interface CarInfotainmentViewProps {
  currentVideo: CarVideoItem | null;
  playlistVideos: CarVideoItem[];
  onSelectVideo: (video: CarVideoItem) => void;
  onOpenLicenseDetails: (video: CarVideoItem) => void;
  onNavigateToWebDownloader?: () => void;
  onClearQueue?: () => void;
}

export const CarInfotainmentView: React.FC<CarInfotainmentViewProps> = ({
  currentVideo,
  playlistVideos,
  onSelectVideo,
  onOpenLicenseDetails,
  onNavigateToWebDownloader,
  onClearQueue
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(214);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isRoadNoiseLevelerActive, setIsRoadNoiseLevelerActive] = useState(true);
  const [displayMode, setDisplayMode] = useState<'night' | 'day'>('night');
  const [drivingSpeed, setDrivingSpeed] = useState<number>(85); // km/h
  const [isDriving, setIsDriving] = useState(false);
  const [showAudioDiagnosisModal, setShowAudioDiagnosisModal] = useState(false);
  const [showMetadataInspector, setShowMetadataInspector] = useState(false);
  const [metadataAnalysis, setMetadataAnalysis] = useState<VideoMetadataVerificationResult | null>(null);
  const [isAnalyzingMetadata, setIsAnalyzingMetadata] = useState(false);
  
  // Check if current video is a video-only DASH stream without audio track
  const isSilentAudioVideo = Boolean(
    currentVideo && (
      currentVideo.audioCodec?.includes('Sin Audio') ||
      currentVideo.audioCodec?.includes('Mudo') ||
      currentVideo.title?.includes('.f133') ||
      currentVideo.title?.includes('playlist_index') ||
      currentVideo.videoStreamUrl?.includes('.f133')
    )
  );

  // Automatically run metadata verification whenever the active video changes
  useEffect(() => {
    if (currentVideo) {
      setIsAnalyzingMetadata(true);
      verifyVideoMetadata(currentVideo, videoRef.current)
        .then(result => setMetadataAnalysis(result))
        .catch(err => console.error('Metadata verification error:', err))
        .finally(() => setIsAnalyzingMetadata(false));
    } else {
      setMetadataAnalysis(null);
    }
  }, [currentVideo?.id, currentVideo?.videoStreamUrl]);

  // Combined evaluation: true if audio track is missing or video is silent stream
  const hasNoAudioTrack = Boolean(
    currentVideo && (
      (metadataAnalysis && !metadataAnalysis.hasAudioTrack) ||
      isSilentAudioVideo
    )
  );

  // Check if current video has Opus or Vorbis audio stream (incompatible with most car stereos)
  const isOpusOrVorbis = Boolean(
    currentVideo && (
      metadataAnalysis?.isOpusOrVorbis ||
      currentVideo.audioCodec?.toLowerCase().includes('opus') ||
      currentVideo.audioCodec?.toLowerCase().includes('vorbis') ||
      currentVideo.title?.toLowerCase().includes('opus') ||
      currentVideo.title?.toLowerCase().includes('vorbis') ||
      currentVideo.videoStreamUrl?.toLowerCase().includes('opus') ||
      currentVideo.videoStreamUrl?.toLowerCase().includes('vorbis')
    )
  );

  const [copiedToolbarCmd, setCopiedToolbarCmd] = useState(false);
  
  // Player engine: 'mp4' (Native Car MP4) or 'youtube' (Official YouTube Embed)
  const [playbackSource, setPlaybackSource] = useState<'mp4' | 'youtube'>('mp4');
  const [hasVideoError, setHasVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Time ticker for car dashboard clock
  const [carClock, setCarClock] = useState('10:45');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCarClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize HTML5 video volume and muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, currentVideo?.id]);

  // Reset errors when video changes
  useEffect(() => {
    setHasVideoError(false);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentVideo?.id]);

  // Sync video element play/pause
  useEffect(() => {
    if (playbackSource === 'mp4' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Autoplay might be temporarily restricted by browser before user gesture
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentVideo, playbackSource]);

  const togglePlay = () => {
    if (playbackSource === 'mp4' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const playNextVideo = () => {
    if (!currentVideo || playlistVideos.length === 0) return;
    const currentIndex = playlistVideos.findIndex(v => v.id === currentVideo.id);
    const nextIndex = (currentIndex + 1) % playlistVideos.length;
    onSelectVideo(playlistVideos[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevVideo = () => {
    if (!currentVideo || playlistVideos.length === 0) return;
    const currentIndex = playlistVideos.findIndex(v => v.id === currentVideo.id);
    const prevIndex = (currentIndex - 1 + playlistVideos.length) % playlistVideos.length;
    onSelectVideo(playlistVideos[prevIndex]);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!currentVideo) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <Tv className="w-16 h-16 text-cyan-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white font-display">Consola de Infoentretenimiento Lista</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Selecciona cualquier video del catálogo para previsualizarlo en el tablero virtual del auto.
        </p>
      </div>
    );
  }

  const isNight = displayMode === 'night';

  return (
    <div className="space-y-4">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Radio className="w-4 h-4" />
            <span>Simulador de Pantalla Central del Vehículo</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            Consola Táctil de Auto (Previsualización)
          </h2>
        </div>

        {/* Console Controls: Source Selector, Driving simulation & Lighting */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Dual Player Mode Toggle (MP4 vs YouTube) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => { setPlaybackSource('mp4'); setHasVideoError(false); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                playbackSource === 'mp4'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>MP4 Vehicular</span>
            </button>
            <button
              onClick={() => setPlaybackSource('youtube')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                playbackSource === 'youtube'
                  ? 'bg-slate-800 text-red-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span>YouTube Embed</span>
            </button>
          </div>

          {/* Video Metadata Inspector CTA Button */}
          <button
            onClick={() => setShowMetadataInspector(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              hasNoAudioTrack
                ? 'bg-red-950/80 text-red-200 border-red-500 hover:bg-red-900 shadow-md shadow-red-950/50 animate-pulse'
                : isOpusOrVorbis
                  ? 'bg-amber-950/80 text-amber-200 border-amber-500 hover:bg-amber-900 shadow-md shadow-amber-950/50'
                  : 'bg-slate-900 text-cyan-400 border-slate-800 hover:text-white hover:border-cyan-700'
            }`}
            title="Abrir herramienta de verificación de metadatos de audio y video"
          >
            <FileCheck2 className={`w-4 h-4 ${hasNoAudioTrack ? 'text-red-400' : isOpusOrVorbis ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">Verificador de Metadatos</span>
            <span className="sm:hidden">Metadatos</span>
            {hasNoAudioTrack ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white font-mono">
                0 Audio · Incompatible
              </span>
            ) : isOpusOrVorbis ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                ⚠️ Opus/Vorbis
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                AAC OK
              </span>
            )}
          </button>

          <button
            onClick={() => setIsDriving(!isDriving)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isDriving 
                ? 'bg-amber-950/60 text-amber-300 border-amber-700' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Simular vibración y velocidad en ruta"
          >
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>{isDriving ? 'En Marcha (D)' : 'Estacionado (P)'}</span>
          </button>

          <button
            onClick={() => setDisplayMode(isNight ? 'day' : 'night')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Alternar modo noche y modo día antirreflejo"
          >
            {isNight ? (
              <>
                <Moon className="w-4 h-4 text-cyan-400" />
                <span>Modo Noche</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Modo Día</span>
              </>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
            title="Pantalla Completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Automotive Bezel Enclosure */}
      <div 
        ref={containerRef}
        className={`rounded-2xl border-4 ${
          isNight 
            ? 'bg-neutral-950 border-neutral-800 shadow-2xl shadow-cyan-950/30 text-white' 
            : 'bg-slate-900 border-slate-700 shadow-2xl text-slate-100'
        } overflow-hidden transition-all duration-300 relative`}
      >
        
        {/* Top Infotainment Status Bar (Car HUD) */}
        <div className="px-5 py-2.5 bg-neutral-950/95 border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 select-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono font-bold text-white text-sm">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{carClock}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-neutral-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>24°C Exterior</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              isDriving ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {isDriving ? `${drivingSpeed} km/h` : 'P · 0 km/h'}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[11px] font-mono">
              <HardDrive className="w-3 h-3" />
              <span>USB 3.0 Conectada</span>
            </div>
          </div>
        </div>

        {/* Central Display Layout: Video Player + Interactive Controls OR Standby Screen */}
        {!currentVideo || playlistVideos.length === 0 ? (
          <div className="p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-neutral-900/40 to-neutral-950/80">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Radio className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                Consola Vehicular en Espera
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                No hay canciones en la cola del tablero. Las canciones de ejemplo han sido eliminadas. Descarga o importa videos en la pestaña de <strong>Descargas Web</strong> para probar la reproducción táctil, calibrar el audio y verificar compatibilidad con estéreos de auto.
              </p>
            </div>
            {onNavigateToWebDownloader && (
              <button
                onClick={onNavigateToWebDownloader}
                className="mt-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Ir a Descargas Web</span>
              </button>
            )}
          </div>
        ) : (
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Main Video Screen (Takes 8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-inner group">
              
              {playbackSource === 'youtube' && currentVideo.youtubeId ? (
                /* YouTube Official Embed */
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : hasVideoError ? (
                /* Fallback Graphic & YouTube Switcher if HTML5 video encountered error */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 to-black space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Vista Previa Vehicular</h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                      {currentVideo.title} ({currentVideo.artist}) · H.264 / AAC 320k
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setPlaybackSource('youtube')}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>Ver en YouTube Oficial</span>
                    </button>
                    <button
                      onClick={() => { setHasVideoError(false); videoRef.current?.load(); }}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reintentar MP4</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Native MP4 Video Player with Safe Fallback */
                <>
                  <video
                    key={currentVideo.videoStreamUrl || currentVideo.id}
                    ref={videoRef}
                    src={currentVideo.videoStreamUrl}
                    poster={currentVideo.thumbnailUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={playNextVideo}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => {
                      // Prevent broken media error from propagating
                      e.preventDefault();
                      console.warn('HTML5 Video source fallback triggered');
                      setHasVideoError(true);
                    }}
                    playsInline
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  >
                    <source 
                      src={currentVideo.videoStreamUrl} 
                      type="video/mp4" 
                      onError={(e) => {
                        e.preventDefault();
                        setHasVideoError(true);
                      }}
                    />
                  </video>

                  {/* Watermark in corner for car resolution indicator */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/70 border border-neutral-700/80 text-[11px] font-mono font-bold text-cyan-400 backdrop-blur-sm pointer-events-none">
                    {currentVideo.resolution} · 60 FPS
                  </div>

                  {/* Warning Overlay on Simulator Screen if video lacks valid audio */}
                  {hasNoAudioTrack && (
                    <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md p-3 rounded-xl bg-red-950/95 border-2 border-red-500 text-xs text-red-100 backdrop-blur-md shadow-2xl flex items-start gap-3 animate-in fade-in z-20">
                      <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shrink-0 mt-0.5">
                        <VolumeX className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500 text-slate-950 font-mono">
                            Advertencia Consola
                          </span>
                          <span className="font-bold text-white text-xs truncate">
                            Video sin pista de audio válida
                          </span>
                        </div>
                        <p className="text-[11px] text-red-200/90 leading-snug">
                          El video requiere recodificación para ser compatible con la consola del coche. En el auto reproducirá en silencio total.
                        </p>
                        <div className="pt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => setShowMetadataInspector(true)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Verificar Metadatos / Solución</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning Overlay on Simulator Screen if video has Opus or Vorbis audio */}
                  {isOpusOrVorbis && !hasNoAudioTrack && (
                    <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md p-3 rounded-xl bg-amber-950/95 border-2 border-amber-500 text-xs text-amber-100 backdrop-blur-md shadow-2xl flex items-start gap-3 animate-in fade-in z-20">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 font-mono">
                            Alerta de Códec
                          </span>
                          <span className="font-bold text-white text-xs truncate">
                            Audio Opus/Vorbis Incompatible
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200/90 leading-snug">
                          Incompatible con la mayoría de estéreos de auto. Se sugiere recodificar a AAC mediante el comando sugerido de FFmpeg.
                        </p>
                        <div className="pt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => setShowMetadataInspector(true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Verificar / Comando FFmpeg</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Big central tactile play button overlay on hover/pause */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Play className="w-8 h-8 fill-slate-950 ml-1" />
                    </button>
                  )}
                </>
              )}

              {/* Driving vibration overlay if driving mode active */}
              {isDriving && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent animate-pulse opacity-20" />
              )}
            </div>

            {/* Video Scrubber (Wide for Driver Touch) */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-xs font-mono text-neutral-400 tabular-nums">
                <span>{formatSeconds(currentTime)}</span>
                <span className="text-neutral-500">H.264 / AAC 320k</span>
                <span>{formatSeconds(duration)}</span>
              </div>
            </div>
          </div>

          {/* Infotainment Dashboard Control Panel (Takes 4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-5 bg-neutral-900/70 border border-neutral-800 p-4 sm:p-5 rounded-xl">
            
            {/* Track Info Card */}
            <div>
              <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold mb-1">
                <span>{currentVideo.genre}</span>
                <span className="font-mono text-neutral-400">{currentVideo.fileSizeMb} MB</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight font-display line-clamp-2">
                {currentVideo.title}
              </h3>
              <p className="text-sm text-neutral-300 line-clamp-1 mt-0.5">
                {currentVideo.artist}
              </p>

              {/* License Quick Badge */}
              <button
                onClick={() => onOpenLicenseDetails(currentVideo)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentVideo.license.type}</span>
              </button>

              {/* Metadata Verification & Car Console Audio Callout */}
              {hasNoAudioTrack ? (
                <div className="mt-3 p-3.5 bg-red-950/80 border-2 border-red-500/80 rounded-xl space-y-2 shadow-lg shadow-red-950/50">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                    <VolumeX className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Incompatible con Consola: Sin Audio</span>
                  </div>
                  <p className="text-[11px] text-red-200/90 leading-snug">
                    El video no contiene ninguna pista de audio válida. <strong>Requiere recodificación para ser compatible con la consola del coche.</strong>
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowMetadataInspector(true)}
                      className="flex-1 py-2 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Verificar Metadatos</span>
                    </button>
                    <button
                      onClick={() => setShowAudioDiagnosisModal(true)}
                      className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                      title="Explicación FFmpeg"
                    >
                      FFmpeg
                    </button>
                  </div>
                </div>
              ) : isOpusOrVorbis ? (
                <div className="mt-3 p-3.5 bg-amber-950/80 border-2 border-amber-500/80 rounded-xl space-y-2.5 shadow-lg shadow-amber-950/50">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Audio Opus / Vorbis Detectado</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      Incompatible
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-snug">
                    Incompatible con la mayoría de estéreos de auto (Pioneer, Sony, Alpine, OEM). <strong>Se sugiere explícitamente la recodificación mediante el comando sugerido de FFmpeg:</strong>
                  </p>
                  <div className="p-2 bg-black/60 rounded border border-amber-900/60 font-mono text-[10px] text-amber-200 select-all overflow-x-auto">
                    <code>{metadataAnalysis?.ffmpegCommand || `ffmpeg -i "${currentVideo.title}.mp4" -c:v copy -c:a aac -b:a 320k -ar 48000 "${currentVideo.title}_auto.mp4"`}</code>
                  </div>
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() => {
                        const cmd = metadataAnalysis?.ffmpegCommand || `ffmpeg -i "${currentVideo.title}.mp4" -c:v copy -c:a aac -b:a 320k -ar 48000 "${currentVideo.title}_auto.mp4"`;
                        navigator.clipboard.writeText(cmd);
                        setCopiedToolbarCmd(true);
                        setTimeout(() => setCopiedToolbarCmd(false), 2000);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copiedToolbarCmd ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5 text-slate-950" />}
                      <span>{copiedToolbarCmd ? '¡Comando Copiado!' : 'Copiar comando FFmpeg'}</span>
                    </button>
                    <button
                      onClick={() => setShowMetadataInspector(true)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700"
                      title="Verificar Metadatos"
                    >
                      Metadatos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">Audio de Consola: <strong className="text-emerald-400">AAC Estéreo OK</strong></span>
                  </div>
                  <button
                    onClick={() => setShowMetadataInspector(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
                  >
                    <FileCheck2 className="w-3 h-3" />
                    <span>Metadatos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tactile Media Buttons (Optimized for automotive reach: min 48px hitboxes) */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 border-y border-neutral-800">
              
              {/* Skip Back 10s */}
              <button
                onClick={() => skipSeconds(-10)}
                className="w-11 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 flex items-center justify-center transition-all"
                title="Retroceder 10 segundos"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Prev Track */}
              <button
                onClick={playPrevVideo}
                className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white flex items-center justify-center transition-all"
                title="Pista Anterior"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              {/* Play / Pause Primary CTA */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-neutral-950" />
                ) : (
                  <Play className="w-7 h-7 fill-neutral-950 ml-1" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={playNextVideo}
                className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white flex items-center justify-center transition-all"
                title="Siguiente Pista"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              {/* Skip Forward 10s */}
              <button
                onClick={() => skipSeconds(10)}
                className="w-11 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 flex items-center justify-center transition-all"
                title="Adelantar 10 segundos"
              >
                <RotateCw className="w-5 h-5" />
              </button>

            </div>

            {/* Road Noise Audio Leveler & Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">Volumen de Cabina</span>
                <button
                  onClick={() => setIsRoadNoiseLevelerActive(!isRoadNoiseLevelerActive)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                    isRoadNoiseLevelerActive 
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                      : 'text-neutral-500'
                  }`}
                  title="Ajusta ecualización para superar el ruido de rodadura del auto"
                >
                  {isRoadNoiseLevelerActive ? '✓ Boost Acústico Auto' : 'Audio Normal'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = nextMuted;
                      if (!nextMuted) {
                        videoRef.current.volume = volume;
                      }
                    }
                  }}
                  className="text-neutral-400 hover:text-white"
                  title={isMuted ? 'Activar audio' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(false);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = false;
                    }
                  }}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Quick Action: Download this video directly to USB format */}
            <button
              onClick={() => downloadSingleVideo(currentVideo)}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Bajar este MP4 para USB</span>
            </button>

          </div>

        </div>
        )}

        {/* Bottom Infotainment Quick Track Carousel (Driver touch queue) */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <ListMusic className="w-4 h-4 text-cyan-400" />
              <span>Cola de Reproducción en Tablero ({playlistVideos.length} canciones)</span>
            </span>
            {playlistVideos.length > 0 && onClearQueue && (
              <button
                onClick={onClearQueue}
                className="flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors px-2 py-0.5 rounded bg-red-950/40 border border-red-800/40 hover:bg-red-900/50"
                title="Eliminar todas las canciones de la cola"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Vaciar cola</span>
              </button>
            )}
          </div>

          {playlistVideos.length === 0 ? (
            <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800/80 text-center space-y-1">
              <p className="text-xs font-semibold text-neutral-400">
                No hay canciones en la cola del tablero (0 canciones)
              </p>
              <p className="text-[11px] text-neutral-500">
                Los videos que descargues o importes desde Descargas Web aparecerán aquí para control táctil en cabina.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {playlistVideos.map((vid) => {
                const isSelected = currentVideo ? vid.id === currentVideo.id : false;
                return (
                  <button
                    key={vid.id}
                    onClick={() => {
                      onSelectVideo(vid);
                      setIsPlaying(true);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-xl text-left shrink-0 max-w-[240px] border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-sm'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <img
                      src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-9 rounded object-cover shrink-0 bg-neutral-900"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">{vid.title}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{vid.artist}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{vid.resolution} · {vid.durationFormatted}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* AUDIO DIAGNOSIS MODAL (Addresses missing audio and FFmpeg requirement) */}
      {showAudioDiagnosisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <VolumeX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    Diagnóstico de Audio: ¿Por qué reproduce mudo?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Análisis técnico del flujo DASH, contenedor MP4 y necesidad de FFmpeg
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAudioDiagnosisModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm text-slate-300 leading-relaxed">
              
              {/* Highlight Box */}
              <div className="p-4 bg-amber-950/40 border border-amber-700/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Respuesta Inmediata: Falta FFmpeg para fusionar el audio</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  El video se reproduce visualmente pero sin ningún sonido porque el archivo descargado tiene formato 
                  <strong className="text-white"> DASH video-only (p. ej. código .f133)</strong>. Este archivo contiene físicamente 0 pistas de audio.
                </p>
              </div>

              {/* Technical Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Causa Técnica: Arquitectura DASH de YouTube
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-semibold text-white block">1. Flujos Separados</span>
                    <p className="text-slate-400">
                      YouTube <strong>no almacena</strong> videos HD con audio unificado. Sirve la pista de video (ej. .f133, .f136, .f137) en un stream y el audio (.f140 AAC o .f251 Opus) en otro stream independiente.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-semibold text-white block">2. yt-dlp sin FFmpeg</span>
                    <p className="text-slate-400">
                      Si se descarga mediante <code className="text-cyan-300">yt-dlp</code> sin tener FFmpeg instalado, la herramienta descarga únicamente el video y descarta el audio porque no puede fusionarlos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Is FFmpeg required? */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¿Es necesario FFmpeg? SÍ, ES OBLIGATORIO</span>
                </div>
                <p className="text-slate-300">
                  FFmpeg es indispensable por 2 motivos fundamentales:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li>
                    <strong className="text-slate-200">Multiplexación (Muxing):</strong> Une el archivo de video H.264 y el archivo de audio dentro del contenedor MP4 estándar.
                  </li>
                  <li>
                    <strong className="text-slate-200">Re-codificación a AAC para el Auto:</strong> Las radios y pantallas de coche (Pioneer, Sony, Android Auto, etc.) únicamente reproducen audio en códec <strong className="text-cyan-300">AAC-LC</strong> dentro de MP4. Si el audio está en Opus o WebM, el reproductor del coche emitirá silencio. FFmpeg re-codifica a AAC automáticamente.
                  </li>
                </ul>
              </div>

              {/* Solution Provided */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/50 to-slate-900 border border-cyan-800/60 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-cyan-300 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4" />
                  <span>Solución Automática en 1 Clic</span>
                </div>
                <p className="text-slate-300">
                  Hemos actualizado el generador de script <strong className="text-white">.bat</strong> en la sección 
                  <em> &quot;Descargas Web &gt; Listas y Lotes&quot;</em>. El nuevo script:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                  <li>Detecta si falta <code className="text-cyan-300">ffmpeg.exe</code> y lo descarga automáticamente vía <code className="text-cyan-300">curl</code> en tu carpeta.</li>
                  <li>Corrige el formateo con dobles porcentajes <code className="text-cyan-300">%%</code> para que Windows no altere el nombre del archivo.</li>
                  <li>Combina video + audio AAC estéreo compatible al 100% con tu auto y computadora.</li>
                </ol>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Códec obligatorio: H.264 + AAC Estéreo</span>
              <button
                onClick={() => setShowAudioDiagnosisModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
              >
                Entendido, Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO METADATA INSPECTOR & CAR CONSOLE COMPATIBILITY TOOL MODAL */}
      <VideoMetadataInspectorModal
        isOpen={showMetadataInspector}
        onClose={() => setShowMetadataInspector(false)}
        currentVideo={currentVideo}
        videoElement={videoRef.current}
      />

    </div>
  );
};

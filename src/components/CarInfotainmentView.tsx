import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Sun,
  Moon,
  Clock,
  ShieldCheck,
  Download,
  Radio,
  Film,
  Youtube,
  RotateCcw,
  RotateCw,
  ListMusic,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  PlusCircle,
  Wrench,
  Music,
} from 'lucide-react';
import { CarVideoItem } from '../types/media';
import { downloadSingleVideo } from '../services/usbExporter';
import { VideoMetadataInspectorModal } from './VideoMetadataInspectorModal';
import {
  verifyVideoMetadata,
  VideoMetadataVerificationResult,
} from '../services/videoMetadataVerifier';
import { formatSeconds } from '../utils/mediaHelpers';

interface CarInfotainmentViewProps {
  currentVideo: CarVideoItem | null;
  playlistVideos: CarVideoItem[];
  onSelectVideo: (video: CarVideoItem) => void;
  onOpenLicenseDetails: (video: CarVideoItem) => void;
  onNavigateToAdd: () => void;
  onOpenRepairTool: () => void;
}

export const CarInfotainmentView: React.FC<CarInfotainmentViewProps> = ({
  currentVideo,
  playlistVideos,
  onSelectVideo,
  onOpenLicenseDetails,
  onNavigateToAdd,
  onOpenRepairTool,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(210);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [displayMode, setDisplayMode] = useState<'night' | 'day'>('night');
  const [showMetadataInspector, setShowMetadataInspector] = useState(false);
  const [metadataAnalysis, setMetadataAnalysis] =
    useState<VideoMetadataVerificationResult | null>(null);
  const [playbackSource, setPlaybackSource] = useState<'mp4' | 'youtube'>('mp4');
  const [hasVideoError, setHasVideoError] = useState(false);
  const [carClock, setCarClock] = useState('10:45');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setCarClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentVideo) {
      setMetadataAnalysis(null);
      return;
    }
    verifyVideoMetadata(currentVideo, videoRef.current)
      .then(setMetadataAnalysis)
      .catch((err) => console.error('Metadata verification error:', err));
  }, [currentVideo?.id, currentVideo?.videoStreamUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, currentVideo?.id]);

  useEffect(() => {
    setHasVideoError(false);
    setPlaybackSource('mp4');
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentVideo?.id]);

  useEffect(() => {
    if (playbackSource === 'mp4' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentVideo?.id, playbackSource]);

  const hasNoAudioTrack = Boolean(
    currentVideo &&
      ((metadataAnalysis && !metadataAnalysis.hasAudioTrack) ||
        currentVideo.audioCodec?.toLowerCase().includes('sin audio') ||
        currentVideo.audioCodec?.toLowerCase().includes('mudo') ||
        currentVideo.title?.includes('.f133'))
  );

  const isOpusOrVorbis = Boolean(
    currentVideo &&
      (metadataAnalysis?.isOpusOrVorbis ||
        currentVideo.audioCodec?.toLowerCase().includes('opus') ||
        currentVideo.audioCodec?.toLowerCase().includes('vorbis'))
  );

  const togglePlay = () => {
    if (playbackSource === 'mp4' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    } else {
      setIsPlaying((p) => !p);
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
    if (!videoRef.current) return;
    const next = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const playNextVideo = () => {
    if (!currentVideo || playlistVideos.length === 0) return;
    const idx = playlistVideos.findIndex((v) => v.id === currentVideo.id);
    onSelectVideo(playlistVideos[(idx + 1) % playlistVideos.length]);
  };

  const playPrevVideo = () => {
    if (!currentVideo || playlistVideos.length === 0) return;
    const idx = playlistVideos.findIndex((v) => v.id === currentVideo.id);
    onSelectVideo(playlistVideos[(idx - 1 + playlistVideos.length) % playlistVideos.length]);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!currentVideo) {
    return (
      <div className="max-w-2xl mx-auto text-center py-14 px-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
          <Radio className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
          Consola del auto en espera
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Añade o importa videos MP4 primero para previsualizar cómo se verán y sonarán en la pantalla de tu vehículo.
        </p>
        <button
          type="button"
          onClick={onNavigateToAdd}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ir a Añadir videos</span>
        </button>
      </div>
    );
  }

  const isNight = displayMode === 'night';

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Probar en el auto
          </h1>
          <p className="text-xs text-slate-400">
            Simulador táctil para verificar imagen y audio antes de copiar a la USB
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentVideo.youtubeId && (
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setPlaybackSource('mp4');
                  setHasVideoError(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  playbackSource === 'mp4' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>MP4</span>
              </button>
              <button
                type="button"
                onClick={() => setPlaybackSource('youtube')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  playbackSource === 'youtube' ? 'bg-slate-800 text-red-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMetadataInspector(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-800 inline-flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Inspeccionar pistas</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode(isNight ? 'day' : 'night')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-slate-800 inline-flex items-center gap-1.5"
          >
            {isNight ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Día</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-400" />
                <span>Noche</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Automotive Console Frame */}
      <div
        ref={containerRef}
        className={`rounded-2xl border-2 overflow-hidden transition-colors ${
          isNight
            ? 'bg-neutral-950 border-neutral-800 text-white shadow-2xl'
            : 'bg-slate-900 border-slate-700 text-slate-100 shadow-xl'
        }`}
      >
        {/* Minimal Car HUD */}
        <div className="px-5 py-2.5 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2 font-mono font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{carClock}</span>
          </div>
          <span className="font-mono text-emerald-400">USB · MP4 H.264 / AAC</span>
        </div>

        {/* Video + Controls Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Player Screen (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800">
              {playbackSource === 'youtube' && currentVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1`}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : hasVideoError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Film className="w-10 h-10 text-cyan-400" />
                  <div>
                    <div className="text-white font-bold text-sm">{currentVideo.title}</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      No se pudo cargar la vista previa de este enlace externo.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {currentVideo.youtubeId && (
                      <button
                        type="button"
                        onClick={() => setPlaybackSource('youtube')}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>Ver en YouTube</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setHasVideoError(false);
                        videoRef.current?.load();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reintentar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    key={currentVideo.videoStreamUrl || currentVideo.id}
                    ref={videoRef}
                    src={currentVideo.videoStreamUrl}
                    poster={currentVideo.thumbnailUrl || undefined}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={playNextVideo}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => {
                      e.preventDefault();
                      setHasVideoError(true);
                    }}
                    playsInline
                    autoPlay
                    className="w-full h-full object-contain"
                  />

                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/70 border border-neutral-700 text-[11px] font-mono text-cyan-400 pointer-events-none">
                    {currentVideo.resolution}
                  </div>

                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                      aria-label="Reproducir"
                    >
                      <Play className="w-7 h-7 fill-slate-950 ml-0.5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Scrubber */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-xs font-mono text-neutral-400 tabular-nums">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
            </div>
          </div>

          {/* Right Control Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-5 bg-neutral-900/70 border border-neutral-800 p-4 sm:p-5 rounded-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
                <span>{currentVideo.genre}</span>
                <span className="font-mono text-neutral-400">{currentVideo.fileSizeMb} MB</span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-white leading-tight font-display line-clamp-2">
                  {currentVideo.title}
                </h2>
                <p className="text-sm text-neutral-300 truncate mt-0.5">{currentVideo.artist}</p>
              </div>

              <button
                type="button"
                onClick={() => onOpenLicenseDetails(currentVideo)}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentVideo.license.type}</span>
              </button>

              {/* Single clear audio compatibility indicator */}
              {hasNoAudioTrack ? (
                <div className="p-3 bg-red-950/70 border border-red-600/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <VolumeX className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Video sin pista de audio</span>
                  </div>
                  <p className="text-[11px] text-red-200 leading-snug">
                    En el coche se verá sin sonido. Úsalo con el reparador para unir el audio AAC.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMetadataInspector(true)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px]"
                    >
                      Ver solución
                    </button>
                    <button
                      type="button"
                      onClick={onOpenRepairTool}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Reparar</span>
                    </button>
                  </div>
                </div>
              ) : isOpusOrVorbis ? (
                <div className="p-3 bg-amber-950/70 border border-amber-600/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Audio Opus/Vorbis (Incompatible)</span>
                  </div>
                  <p className="text-[11px] text-amber-200 leading-snug">
                    Muchos estéreos de auto no reproducen Opus. Recodifica el audio a AAC.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMetadataInspector(true)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
                    >
                      Ver comando FFmpeg
                    </button>
                    <button
                      type="button"
                      onClick={onOpenRepairTool}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Reparar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">
                      Audio: <strong className="text-emerald-400">AAC Estéreo OK</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMetadataInspector(true)}
                    className="text-[11px] text-cyan-400 hover:underline font-mono"
                  >
                    Detalles
                  </button>
                </div>
              )}
            </div>

            {/* Tactile Transport Controls */}
            <div className="flex items-center justify-center gap-2 py-2 border-y border-neutral-800">
              <button
                type="button"
                onClick={() => skipSeconds(-10)}
                className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center"
                title="Retroceder 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={playPrevVideo}
                className="w-11 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                title="Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="w-13 h-13 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-slate-950" />
                ) : (
                  <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={playNextVideo}
                className="w-11 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center"
                title="Siguiente"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => skipSeconds(10)}
                className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center"
                title="Adelantar 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
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
                }}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <button
              type="button"
              onClick={() => downloadSingleVideo(currentVideo)}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-neutral-700"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Descargar este MP4</span>
            </button>
          </div>
        </div>

        {/* Bottom Queue Strip */}
        {playlistVideos.length > 0 && (
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 space-y-2">
            <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <ListMusic className="w-4 h-4 text-cyan-400" />
              <span>Videos en Mi USB ({playlistVideos.length})</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {playlistVideos.map((vid) => {
                const isSelected = vid.id === currentVideo.id;
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => onSelectVideo(vid)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-left shrink-0 max-w-[230px] border transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="w-10 h-8 rounded bg-neutral-800 flex items-center justify-center shrink-0 text-cyan-400">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{vid.title}</div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {vid.artist} · {vid.durationFormatted}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <VideoMetadataInspectorModal
        isOpen={showMetadataInspector}
        onClose={() => setShowMetadataInspector(false)}
        currentVideo={currentVideo}
        videoElement={videoRef.current}
      />
    </div>
  );
};

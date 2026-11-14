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
  Car,
} from 'lucide-react';
import { CarVideoItem } from '../types/media';
import {
  verifyVideoMetadata,
  VideoMetadataVerificationResult,
  generateFolderRepairBat,
} from '../services/videoMetadataVerifier';
import { downloadBlob, useClipboard } from '../utils/mediaHelpers';

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
  videoElement,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'upload'>('current');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoMetadataVerificationResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copiedKey, copy } = useClipboard();

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
      setResult(res);
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
      setResult(res);
    } catch (err) {
      console.error('Error verifying uploaded file:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Inspector de Audio y Video para Auto
              </h2>
              <p className="text-xs text-slate-400">
                Verifica las pistas MP4, códecs y si requiere recodificación FFmpeg
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800 bg-slate-900 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Video actual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Analizar archivo de tu PC</span>
          </button>

          {activeTab === 'current' && (
            <button
              type="button"
              onClick={analyzeCurrentVideo}
              disabled={isAnalyzing}
              className="ml-auto px-2.5 py-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Reanalizar</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'upload' && (
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 text-center space-y-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.m4v,.mkv,.webm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-slate-300">
                Selecciona un video de tu computadora para leer sus pistas internas de audio y video.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Elegir archivo de video</span>
              </button>
              {uploadedFileName && (
                <div className="text-cyan-400 font-mono">Archivo: {uploadedFileName}</div>
              )}
            </div>
          )}

          {isAnalyzing ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
              <div className="text-sm font-bold text-white">Analizando metadatos MP4...</div>
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* Status banner */}
              {!result.hasAudioTrack ? (
                <div className="p-4 rounded-xl border border-red-500/80 bg-red-950/60 flex items-start gap-3">
                  <VolumeX className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">Video sin pista de audio</div>
                    <p className="text-red-200 leading-relaxed">{result.recodingReason}</p>
                  </div>
                </div>
              ) : result.isOpusOrVorbis || result.compatibilityStatus === 'warning' ? (
                <div className="p-4 rounded-xl border border-amber-500/80 bg-amber-950/60 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">
                      Audio {result.audioCodec} incompatible con la mayoría de estéreos
                    </div>
                    <p className="text-amber-200 leading-relaxed">{result.recodingReason}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-500/60 bg-emerald-950/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-white">Compatible con pantalla de auto</div>
                      <div className="text-slate-400">
                        {result.audioCodec} · {result.audioChannels} canales · {result.audioSampleRate} Hz
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">100%</div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Audio</span>
                    {result.hasAudioTrack ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="font-bold font-mono text-sm text-white mt-1">
                    {result.audioTrackCount > 0 ? `${result.audioTrackCount} Pista` : '0 (Mudo)'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400">Códec Audio</div>
                  <div className="font-bold font-mono text-sm text-white mt-1 truncate">
                    {result.audioCodec}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Video</span>
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="font-bold font-mono text-sm text-cyan-400 mt-1 truncate">
                    {result.videoCodec}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400">Consola</div>
                  <div
                    className={`font-bold font-mono text-sm mt-1 ${
                      result.isCarConsoleCompatible ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {result.isCarConsoleCompatible ? 'COMPATIBLE' : 'RECODIFICAR'}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 divide-y divide-slate-800/60">
                {result.detailedChecks.map((check) => (
                  <div key={check.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {check.status === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : check.status === 'warn' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-white">{check.title}</div>
                        <div className="text-[11px] text-slate-400">{check.carImpact}</div>
                      </div>
                    </div>
                    <div className="font-mono text-right shrink-0 text-slate-300">{check.detected}</div>
                  </div>
                ))}
              </div>

              {/* Fix Section if needed */}
              {result.requiresRecoding && (
                <div className="p-4 rounded-xl border border-cyan-800/60 bg-slate-950 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Solución rápida con FFmpeg</span>
                  </div>
                  <p className="text-slate-300">{result.recodingSolution}</p>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
                    {result.ffmpegCommand}
                  </pre>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          result.windowsBatchScript,
                          `Recodificar_${result.fileName.replace(/\.[^/.]+$/, '')}.bat`
                        )
                      }
                      className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Script .bat para este video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadBlob(generateFolderRepairBat(), 'Reparar_Videos_Auto.bat')}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Reparar carpeta (.bat)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(result.ffmpegCommand, 'ffmpeg')}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
                    >
                      {copiedKey === 'ffmpeg' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'ffmpeg' ? 'Copiado' : 'Copiar comando'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono truncate">{result?.fileName || currentVideo?.title || 'Sin archivo'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

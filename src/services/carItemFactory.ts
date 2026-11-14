import {
  ArchiveSearchResult,
  AnalyzedLocalFile,
  CarVideoGenre,
  CarVideoItem,
  VideoResolution,
} from '../types/media';
import { detectAudioCodecIssue, inspectBlobMp4Boxes } from './videoMetadataVerifier';
import { formatDurationOrUnknown } from '../utils/mediaHelpers';

function classifyHeightToResolution(height: number): VideoResolution {
  if (!Number.isFinite(height) || height <= 0) return 'Sin verificar';
  if (height >= 1000) return '1080p';
  if (height >= 600) return '720p';
  return '480p';
}

async function probeVideoElementMetadata(
  objectUrl: string
): Promise<{ durationSeconds: number; width: number; height: number }> {
  if (typeof document === 'undefined') {
    return { durationSeconds: 0, width: 0, height: 0 };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    let settled = false;

    const finish = (meta: { durationSeconds: number; width: number; height: number }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
      resolve(meta);
    };

    const timer = setTimeout(() => finish({ durationSeconds: 0, width: 0, height: 0 }), 2500);

    video.onloadedmetadata = () => {
      const durationSeconds =
        Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : 0;
      finish({
        durationSeconds,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
    };

    video.onerror = () => finish({ durationSeconds: 0, width: 0, height: 0 });
    video.src = objectUrl;
  });
}

function resolveAnalyzedAudioCodec(
  issue: ReturnType<typeof detectAudioCodecIssue>,
  detectedCodecHint: string
): { audioCodec: string; isMetadataVerified: boolean } {
  if (issue.isSilent) {
    return { audioCodec: 'Sin Audio (Mudo)', isMetadataVerified: true };
  }
  if (issue.isOpusOrVorbis) {
    return { audioCodec: issue.codecName, isMetadataVerified: true };
  }
  if (detectedCodecHint) {
    return { audioCodec: detectedCodecHint, isMetadataVerified: true };
  }
  return { audioCodec: 'Sin verificar (cabecera no leída)', isMetadataVerified: false };
}

function resolveCarItemAudioCodec(analyzed: AnalyzedLocalFile): string {
  if (analyzed.isOpusOrVorbis) {
    return `${analyzed.audioCodec} (Incompatible con estéreo)`;
  }
  if (analyzed.isSilentStream) {
    return 'Sin Audio (Mudo .f133)';
  }
  return analyzed.audioCodec || 'Sin verificar';
}

/**
 * Converts an Archive.org search item into a CarVideoItem ready for USB & Cockpit preview.
 */
export function fromArchiveResult(
  item: ArchiveSearchResult,
  genre: CarVideoGenre = 'Otros'
): CarVideoItem {
  const stream = item.streamUrl || item.videoStreamUrl || item.downloadUrl;
  const durationSeconds = Number.isFinite(item.durationSeconds) && item.durationSeconds > 0
    ? Math.round(item.durationSeconds)
    : 0;
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    genre,
    durationSeconds,
    durationFormatted: item.durationFormatted || formatDurationOrUnknown(durationSeconds),
    resolution: item.resolution || 'Sin verificar',
    fps: 30,
    videoCodec: item.videoCodec || 'MP4 (Sin verificar)',
    audioCodec: item.audioCodec || 'Sin verificar (archivo remoto)',
    fileSizeMb: item.fileSizeMb,
    thumbnailUrl: '',
    videoStreamUrl: stream,
    addedAt: new Date().toISOString(),
    license: {
      type: 'Dominio Público',
      holder: 'Internet Archive',
      attribution: 'Dominio público y acceso abierto',
      sourceUrl: item.downloadUrl,
      carPlaybackAllowed: true,
      legalNotice: 'Material de acceso público para uso personal en vehículo.',
    },
  };
}

/**
 * Analyzes a user-selected local video file (MP4 headers + HTML5 loadedmetadata + heuristics)
 * without fabricating unverified metadata or duplicating prefixes.
 */
export async function analyzeLocalVideoFile(
  file: File,
  index: number
): Promise<AnalyzedLocalFile> {
  const rawName = file.name.replace(/\.[^/.]+$/, '');
  const cleanTitle =
    rawName
      .replace(/\(playlist_index\)\d*d?\s*-\s*\(ext\)s/gi, 'Pista Musical')
      .replace(/^\d{1,3}\s*[-._]\s*/, '')
      .replace(/\s*\((?:2160p|1080p|720p|480p|360p|Sin verificar)\)\s*$/i, '')
      .replace(/[^\w\s\u00C0-\u024F-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Video Musical';

  const safeCarName = `${cleanTitle}.mp4`;
  const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
  const url = URL.createObjectURL(file);

  let detectedCodecHint = '';
  let detectedVideoCodec = '';
  let parsedHeight = 0;
  let headerSilent = false;

  const [parsed, videoMeta] = await Promise.all([
    inspectBlobMp4Boxes(file, file.name),
    probeVideoElementMetadata(url),
  ]);

  if (parsed) {
    if (parsed.videoTracks.length > 0) {
      detectedVideoCodec = parsed.videoTracks[0].codec;
      parsedHeight = parsed.videoTracks[0].height;
    }
    if (parsed.audioTracks.length > 0) {
      detectedCodecHint = parsed.audioTracks[0].codec;
    } else if (
      file.name.toLowerCase().endsWith('.mp4') &&
      parsed.videoTracks.length > 0 &&
      parsed.container.startsWith('MP4')
    ) {
      headerSilent = true;
    }
  }

  const issue = detectAudioCodecIssue(
    headerSilent ? 'Sin Audio' : detectedCodecHint || undefined,
    file.name
  );

  let streamFormatNote: string | undefined;
  if (issue.isSilent) {
    streamFormatNote = 'Video sin pista de audio compatible. Requiere unir audio con FFmpeg.';
  } else if (issue.isOpusOrVorbis) {
    streamFormatNote = issue.uiWarningText;
  }

  const { audioCodec, isMetadataVerified } = resolveAnalyzedAudioCodec(issue, detectedCodecHint);
  const durationSeconds = videoMeta.durationSeconds;
  const durationFormatted = formatDurationOrUnknown(durationSeconds);
  const effectiveHeight = videoMeta.height || parsedHeight;
  const resolution = classifyHeightToResolution(effectiveHeight);

  return {
    id: `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    file,
    name: file.name,
    sizeMb,
    cleanTitle,
    safeCarName,
    url,
    durationSeconds,
    durationFormatted,
    resolution,
    status: 'ready',
    isSilentStream: issue.isSilent,
    isOpusOrVorbis: issue.isOpusOrVorbis,
    videoCodec: detectedVideoCodec || 'Sin verificar',
    audioCodec,
    isMetadataVerified,
    streamFormatNote,
    suggestedFfmpegCommand:
      issue.isSilent || issue.isOpusOrVorbis ? issue.suggestedFfmpegCommand : undefined,
  };
}

/**
 * Converts an AnalyzedLocalFile into a CarVideoItem for USB export or Cockpit preview.
 */
export function fromLocalFile(
  analyzed: AnalyzedLocalFile,
  genre: CarVideoGenre = 'Otros'
): CarVideoItem {
  return {
    id: analyzed.id,
    title: analyzed.cleanTitle,
    artist: 'Archivo local',
    genre,
    durationSeconds: analyzed.durationSeconds,
    durationFormatted: analyzed.durationFormatted,
    resolution: analyzed.resolution,
    fps: 30,
    videoCodec: analyzed.videoCodec || 'Sin verificar',
    audioCodec: resolveCarItemAudioCodec(analyzed),
    fileSizeMb: analyzed.sizeMb,
    thumbnailUrl: '',
    videoStreamUrl: analyzed.url,
    addedAt: new Date().toISOString(),
    license: {
      type: 'Autorizado para Uso Personal',
      holder: 'Archivo Local del Usuario',
      attribution: 'Copia privada del usuario',
      carPlaybackAllowed: true,
      legalNotice: 'Copia privada autorizada para reproducción en vehículo.',
    },
  };
}

import { ArchiveSearchResult, AnalyzedLocalFile, CarVideoItem } from '../types/media';
import { detectAudioCodecIssue, parseMp4Metadata } from './videoMetadataVerifier';

/**
 * Converts an Archive.org search item into a CarVideoItem ready for USB & Cockpit preview.
 */
export function fromArchiveResult(item: ArchiveSearchResult): CarVideoItem {
  const stream = item.streamUrl || item.videoStreamUrl || item.downloadUrl;
  return {
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
 * Analyzes a user-selected local video file (MP4 headers + codec heuristics)
 * reusing parseMp4Metadata and detectAudioCodecIssue.
 */
export async function analyzeLocalVideoFile(
  file: File,
  index: number
): Promise<AnalyzedLocalFile> {
  const rawName = file.name.replace(/\.[^/.]+$/, '');
  const cleanName = rawName
    .replace(/\(playlist_index\)\d*d?\s*-\s*\(ext\)s/gi, 'Pista Musical')
    .replace(/[^\w\s\u00C0-\u024F-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const safeCarName = `${String(index + 1).padStart(2, '0')} - ${cleanName || 'Video_Musical'} (720p).mp4`;
  const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
  const url = URL.createObjectURL(file);

  let detectedCodecHint = '';
  let headerSilent = false;

  try {
    const slice = await file.slice(0, 65536).arrayBuffer();
    const parsed = parseMp4Metadata(slice, file.name);
    if (parsed.audioTracks.length > 0) {
      detectedCodecHint = parsed.audioTracks[0].codec;
    } else if (
      file.name.toLowerCase().endsWith('.mp4') &&
      file.size > 5 * 1024 * 1024 &&
      parsed.videoTracks.length > 0
    ) {
      headerSilent = true;
    }
  } catch {
    // Fallback to filename heuristics when header cannot be sliced
  }

  const issue = detectAudioCodecIssue(
    headerSilent ? 'Sin Audio' : detectedCodecHint || undefined,
    file.name
  );

  let streamFormatNote: string | undefined;
  if (issue.isSilent) {
    streamFormatNote = 'Video DASH sin pista de audio (.f133). Requiere unir audio con FFmpeg.';
  } else if (issue.isOpusOrVorbis) {
    streamFormatNote = issue.uiWarningText;
  }

  return {
    id: `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    file,
    name: file.name,
    sizeMb,
    safeCarName,
    url,
    durationFormatted: '03:30',
    status: 'ready',
    isSilentStream: issue.isSilent,
    isOpusOrVorbis: issue.isOpusOrVorbis,
    audioCodec: issue.isSilent
      ? 'Sin Audio (Mudo)'
      : issue.isOpusOrVorbis
        ? issue.codecName
        : detectedCodecHint || 'AAC Estéreo',
    streamFormatNote,
    suggestedFfmpegCommand:
      issue.isSilent || issue.isOpusOrVorbis ? issue.suggestedFfmpegCommand : undefined,
  };
}

/**
 * Converts an AnalyzedLocalFile into a CarVideoItem for USB export or Cockpit preview.
 */
export function fromLocalFile(analyzed: AnalyzedLocalFile): CarVideoItem {
  return {
    id: analyzed.id,
    title: analyzed.safeCarName.replace(/\.mp4$/i, ''),
    artist: 'Archivo local',
    genre: 'Acústico',
    durationSeconds: 210,
    durationFormatted: analyzed.durationFormatted,
    resolution: '720p',
    fps: 30,
    videoCodec: 'H.264 (Local)',
    audioCodec: analyzed.isOpusOrVorbis
      ? `${analyzed.audioCodec} (Incompatible con estéreo)`
      : analyzed.isSilentStream
        ? 'Sin Audio (Mudo .f133)'
        : analyzed.audioCodec || 'AAC Estéreo',
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

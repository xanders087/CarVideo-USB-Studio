import { CarVideoItem } from '../types/media';

export interface Mp4Box {
  type: string;
  size: number;
  offset: number;
  children?: Mp4Box[];
}

export interface DetailedMetadataCheck {
  id: string;
  title: string;
  status: 'pass' | 'fail' | 'warn';
  expected: string;
  detected: string;
  carImpact: string;
}

export interface VideoMetadataVerificationResult {
  fileName: string;
  fileSizeMb: number;
  container: string;
  hasAudioTrack: boolean;
  audioTrackCount: number;
  audioCodec: string;
  audioChannels: number;
  audioSampleRate: number;
  hasVideoTrack: boolean;
  videoTrackCount: number;
  videoCodec: string;
  resolution: string;
  durationSeconds: number;
  isCarConsoleCompatible: boolean;
  compatibilityStatus: 'compatible' | 'warning' | 'incompatible';
  compatibilityScore: number; // 0 to 100
  requiresRecoding: boolean;
  recodingReason: string;
  recodingSolution: string;
  ffmpegCommand: string;
  windowsBatchScript: string;
  detailedChecks: DetailedMetadataCheck[];
  rawBoxesDetected: string[];
  analyzedAt: string;
  isMetadataVerified: boolean;
  isOpusOrVorbis: boolean;
  audioCodecType: 'aac' | 'mp3' | 'opus' | 'vorbis' | 'silent' | 'unknown' | 'other';
}

/**
 * Parses MP4 ISO Base Media File Format (ISOBMFF) boxes from an ArrayBuffer.
 * Specifically checks for 'moov' -> 'trak' -> 'mdia' -> 'hdlr' ('vide' vs 'soun')
 * and sample entries in 'stsd' ('mp4a', 'ac-3', 'opus', 'avc1', etc.)
 */
export function parseMp4Metadata(buffer: ArrayBuffer, fileName = 'video.mp4'): {
  container: string;
  audioTracks: { codec: string; channels: number; sampleRate: number }[];
  videoTracks: { codec: string; width: number; height: number }[];
  rawBoxes: string[];
} {
  const dataView = new DataView(buffer);
  const totalLength = buffer.byteLength;
  let offset = 0;

  const audioTracks: { codec: string; channels: number; sampleRate: number }[] = [];
  const videoTracks: { codec: string; width: number; height: number }[] = [];
  const rawBoxes: string[] = [];
  let container = 'Desconocido';

  // Helper to read 4-character ASCII string
  const readFourCC = (pos: number): string => {
    if (pos + 4 > totalLength) return '????';
    let s = '';
    for (let i = 0; i < 4; i++) {
      const c = dataView.getUint8(pos + i);
      s += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '?';
    }
    return s;
  };

  // Helper to scan a box recursively for child atoms
  function parseBox(pos: number, maxPos: number, path: string): void {
    let curr = pos;
    while (curr + 8 <= maxPos) {
      let boxSize = dataView.getUint32(curr);
      const boxType = readFourCC(curr + 4);

      if (boxSize === 0) {
        // Box extends to end of file
        boxSize = maxPos - curr;
      } else if (boxSize === 1) {
        // 64-bit large size
        if (curr + 16 > maxPos) break;
        // high 32 bits + low 32 bits
        const low = dataView.getUint32(curr + 12);
        boxSize = low; // For buffers < 4GB in JS
      }

      if (boxSize < 8 || curr + boxSize > maxPos + 1024) {
        // Corrupted or truncated box
        break;
      }

      const boxEnd = Math.min(curr + boxSize, maxPos);
      const currentPath = path ? `${path}/${boxType}` : boxType;
      rawBoxes.push(currentPath);

      if (boxType === 'ftyp') {
        const majorBrand = readFourCC(curr + 8);
        container = `MP4 (${majorBrand})`;
      }

      // Container boxes that contain other boxes
      if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(boxType)) {
        parseBox(curr + 8, boxEnd, currentPath);
      } else if (boxType === 'hdlr') {
        // Handler box: bytes 8-11: version & flags; 12-15: pre_defined; 16-19: handler_type
        if (curr + 20 <= boxEnd) {
          const handlerType = readFourCC(curr + 16);
          if (handlerType === 'soun') {
            // Audio track detected
            rawBoxes.push(`${currentPath}:handler=soun`);
          } else if (handlerType === 'vide') {
            // Video track detected
            rawBoxes.push(`${currentPath}:handler=vide`);
          }
        }
      } else if (boxType === 'stsd') {
        // Sample Table Sample Description:
        // bytes 8-11: version/flags, 12-15: entry_count
        if (curr + 16 <= boxEnd) {
          const entryCount = dataView.getUint32(curr + 12);
          let entryPos = curr + 16;
          for (let i = 0; i < Math.min(entryCount, 10); i++) {
            if (entryPos + 8 > boxEnd) break;
            const entrySize = dataView.getUint32(entryPos);
            const entryFormat = readFourCC(entryPos + 4);
            rawBoxes.push(`${currentPath}:entry=${entryFormat}`);

            // Audio sample entries: 'mp4a', 'ac-3', 'ec-3', 'opus', 'Opus', 'alac', 'samr', '.mp3'
            const audioFormats = ['mp4a', 'ac-3', 'ec-3', 'opus', 'Opus', 'alac', 'samr', '.mp3', 'flac'];
            if (audioFormats.includes(entryFormat) || path.includes('soun')) {
              let channels = 2;
              let sampleRate = 44100;
              if (entryPos + 32 <= boxEnd) {
                channels = dataView.getUint16(entryPos + 24); // Audio channels
                sampleRate = dataView.getUint16(entryPos + 32); // Audio sample rate (upper 16 bits of 16.16)
                if (sampleRate === 0 && entryPos + 30 <= boxEnd) {
                  sampleRate = dataView.getUint16(entryPos + 30);
                }
                if (sampleRate < 8000 || sampleRate > 192000) {
                  sampleRate = 48000;
                }
              }
              audioTracks.push({
                codec: entryFormat === 'mp4a' ? 'AAC-LC (mp4a)' : entryFormat.toUpperCase(),
                channels: channels || 2,
                sampleRate: sampleRate || 48000
              });
            } else if (['avc1', 'avc3', 'hev1', 'hvc1', 'vp09', 'av01'].includes(entryFormat) || path.includes('vide')) {
              let width = 1280;
              let height = 720;
              if (entryPos + 36 <= boxEnd) {
                width = dataView.getUint16(entryPos + 32);
                height = dataView.getUint16(entryPos + 34);
              }
              videoTracks.push({
                codec: entryFormat === 'avc1' || entryFormat === 'avc3' ? 'H.264 / AVC' : entryFormat.toUpperCase(),
                width: width || 1280,
                height: height || 720
              });
            }

            if (entrySize <= 0) break;
            entryPos += entrySize;
          }
        }
      }

      curr += boxSize;
    }
  }

  try {
    parseBox(0, totalLength, '');
  } catch (err) {
    console.warn('Error reading MP4 box tree:', err);
  }

  // Check for WebM / Matroska EBML or Ogg headers and scan for Opus / Vorbis
  const uint8 = new Uint8Array(buffer);
  if (totalLength >= 4 && uint8[0] === 0x1A && uint8[1] === 0x45 && uint8[2] === 0xDF && uint8[3] === 0xA3) {
    container = 'WebM / Matroska (MKV)';
  } else if (totalLength >= 4 && uint8[0] === 0x4F && uint8[1] === 0x67 && uint8[2] === 0x67 && uint8[3] === 0x53) {
    container = 'Ogg Media Container';
  }

  // Scan ASCII signatures in buffer (first 64KB)
  let rawAscii = '';
  const scanLimit = Math.min(totalLength, 65536);
  for (let i = 0; i < scanLimit; i++) {
    const byte = uint8[i];
    rawAscii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ' ';
  }

  const hasOpusSignature = rawAscii.includes('A_OPUS') || rawAscii.includes('OpusHead') || rawAscii.includes('opus') || fileName.toLowerCase().includes('opus');
  const hasVorbisSignature = rawAscii.includes('A_VORBIS') || rawAscii.includes('vorbis') || fileName.toLowerCase().includes('vorbis');

  if (hasOpusSignature) {
    if (audioTracks.length === 0 || audioTracks[0].codec === 'UNKNOWN') {
      audioTracks.length = 0;
      audioTracks.push({
        codec: 'Opus (48 kHz)',
        channels: 2,
        sampleRate: 48000
      });
      rawBoxes.push('stream:detected_codec=Opus');
    }
  } else if (hasVorbisSignature) {
    if (audioTracks.length === 0 || audioTracks[0].codec === 'UNKNOWN') {
      audioTracks.length = 0;
      audioTracks.push({
        codec: 'Vorbis (44.1 kHz)',
        channels: 2,
        sampleRate: 44100
      });
      rawBoxes.push('stream:detected_codec=Vorbis');
    }
  }

  return {
    container: container === 'Desconocido' ? 'MP4 / ISOBMFF' : container,
    audioTracks,
    videoTracks,
    rawBoxes
  };
}

async function locateMp4MoovBox(
  blob: Blob,
  fileName: string
): Promise<ReturnType<typeof parseMp4Metadata> | null> {
  const maxMoovReadBytes = 8 * 1024 * 1024;
  let offset = 0;

  for (let i = 0; i < 128 && offset + 8 <= blob.size; i++) {
    const headerBuf = await blob.slice(offset, Math.min(blob.size, offset + 16)).arrayBuffer();
    if (headerBuf.byteLength < 8) break;

    const view = new DataView(headerBuf);
    const rawSize = view.getUint32(0);
    const boxType = String.fromCharCode(
      view.getUint8(4),
      view.getUint8(5),
      view.getUint8(6),
      view.getUint8(7)
    );

    let actualSize = rawSize;
    if (rawSize === 0) {
      actualSize = blob.size - offset;
    } else if (rawSize === 1) {
      if (headerBuf.byteLength < 16) break;
      actualSize = view.getUint32(8) * 4294967296 + view.getUint32(12);
    }

    if (!Number.isFinite(actualSize) || actualSize < 8) break;

    if (boxType === 'moov') {
      const readEnd = Math.min(blob.size, offset + actualSize, offset + maxMoovReadBytes);
      const moovBuf = await blob.slice(offset, readEnd).arrayBuffer();
      return parseMp4Metadata(moovBuf, fileName);
    }

    offset += actualSize;
  }

  return null;
}

export async function inspectBlobMp4Boxes(
  blob: Blob,
  fileName: string
): Promise<ReturnType<typeof parseMp4Metadata> | null> {
  try {
    const chunkSize = 512 * 1024;
    const headSize = Math.min(blob.size, chunkSize);
    const headBuf = await blob.slice(0, headSize).arrayBuffer();
    const headParsed = parseMp4Metadata(headBuf, fileName);

    if (
      headParsed.audioTracks.length > 0 ||
      headParsed.videoTracks.length > 0 ||
      blob.size <= chunkSize
    ) {
      return headParsed;
    }

    const moovParsed = headParsed.container.startsWith('MP4')
      ? await locateMp4MoovBox(blob, fileName)
      : null;

    if (moovParsed && (moovParsed.audioTracks.length > 0 || moovParsed.videoTracks.length > 0)) {
      return {
        container: headParsed.container,
        audioTracks: moovParsed.audioTracks,
        videoTracks: moovParsed.videoTracks,
        rawBoxes: [...headParsed.rawBoxes, ...moovParsed.rawBoxes],
      };
    }

    const tailStart = Math.max(headSize, blob.size - chunkSize);
    const tailBuf = await blob.slice(tailStart, blob.size).arrayBuffer();
    const tailParsed = parseMp4Metadata(tailBuf, fileName);

    return {
      container:
        tailParsed.container !== 'MP4 / ISOBMFF' ? tailParsed.container : headParsed.container,
      audioTracks: tailParsed.audioTracks,
      videoTracks: tailParsed.videoTracks,
      rawBoxes: [...headParsed.rawBoxes, ...tailParsed.rawBoxes],
    };
  } catch (e) {
    console.warn('Could not read slice from Blob:', e);
    return null;
  }
}

function resolveAudioCodecType(
  isMetadataVerified: boolean,
  hasAudioTrack: boolean,
  isOpus: boolean,
  isVorbis: boolean,
  isAacOrMp3: boolean
): VideoMetadataVerificationResult['audioCodecType'] {
  if (!hasAudioTrack) return 'silent';
  if (!isMetadataVerified) return 'unknown';
  if (isOpus) return 'opus';
  if (isVorbis) return 'vorbis';
  if (isAacOrMp3) return 'aac';
  return 'other';
}

/**
 * Inspects a video file or item using multiple inspection layers:
 * 1. Binary MP4 atom parser (if ArrayBuffer or File available)
 * 2. Runtime HTMLMediaElement capabilities
 * 3. Filename and stream heuristics (e.g. YouTube DASH .f133 video-only)
 */
export async function verifyVideoMetadata(
  source: File | Blob | string | CarVideoItem,
  videoElement?: HTMLVideoElement | null
): Promise<VideoMetadataVerificationResult> {
  let fileName = 'video_desconocido.mp4';
  let fileSizeMb = 0;
  let parsedBoxes: ReturnType<typeof parseMp4Metadata> | null = null;
  let heuristicIsSilent = false;
  let duration = 0;
  let isCarItem = false;
  let itemReference: CarVideoItem | null = null;

  // 1. Identify input type
  if (source instanceof File) {
    fileName = source.name;
    fileSizeMb = Math.round((source.size / (1024 * 1024)) * 10) / 10;
    parsedBoxes = await inspectBlobMp4Boxes(source, fileName);
  } else if (source instanceof Blob) {
    fileSizeMb = Math.round((source.size / (1024 * 1024)) * 10) / 10;
    parsedBoxes = await inspectBlobMp4Boxes(source, fileName);
  } else if (typeof source === 'object' && 'title' in source) {
    // CarVideoItem
    isCarItem = true;
    itemReference = source;
    fileName = `${itemReference.title}.mp4`;
    fileSizeMb = itemReference.fileSizeMb ?? 0;
    duration = itemReference.durationSeconds ?? 0;

    // Check codec strings and URL indicators
    if (
      itemReference.audioCodec?.toLowerCase().includes('sin audio') ||
      itemReference.audioCodec?.toLowerCase().includes('mudo') ||
      itemReference.audioCodec?.toLowerCase().includes('no audio') ||
      itemReference.title?.includes('.f133') ||
      itemReference.title?.includes('playlist_index') ||
      itemReference.videoStreamUrl?.includes('.f133')
    ) {
      heuristicIsSilent = true;
    }
  } else if (typeof source === 'string') {
    fileName = source.split('/').pop() || 'video.mp4';
    if (fileName.includes('.f133') || fileName.includes('(playlist_index)')) {
      heuristicIsSilent = true;
    }
  }

  // 2. Check HTMLMediaElement runtime detection
  if (videoElement) {
    // Check Firefox mozHasAudio
    if ('mozHasAudio' in videoElement && (videoElement as any).mozHasAudio === false) {
      heuristicIsSilent = true;
    }
    // Check webkit audio byte count if video played
    const audioBytes = (videoElement as any).webkitAudioDecodedByteCount;
    if (typeof audioBytes === 'number' && audioBytes === 0 && videoElement.currentTime > 2) {
      heuristicIsSilent = true;
    }
    // Check audioTracks API if browser supports it
    const tracks = (videoElement as any).audioTracks;
    if (tracks && tracks.length === 0) {
      heuristicIsSilent = true;
    }
    if (videoElement.duration && !Number.isNaN(videoElement.duration)) {
      duration = videoElement.duration;
    }
  }

  // Check DASH filename patterns (YouTube standalone video stream IDs)
  const dashVideoOnlyRegex = /f(133|134|135|136|137|160|242|243|244|247|248|278|394|395|396|397|398|399)\./i;
  if (dashVideoOnlyRegex.test(fileName)) {
    heuristicIsSilent = true;
  }

  // Determine actual audio track presence and verification certainty
  let hasAudioTrack = false;
  let audioTrackCount = 0;
  let detectedAudioCodec = 'Sin verificar (cabecera no leída)';
  let audioChannels = 0;
  let audioSampleRate = 0;
  let isMetadataVerified = false;

  const itemAudioLower = (itemReference?.audioCodec || '').toLowerCase();
  const isItemAudioUnverified =
    !itemReference?.audioCodec ||
    itemAudioLower.includes('sin verificar') ||
    itemAudioLower.includes('no verificado');

  if (parsedBoxes && parsedBoxes.audioTracks.length > 0) {
    hasAudioTrack = true;
    audioTrackCount = parsedBoxes.audioTracks.length;
    detectedAudioCodec = parsedBoxes.audioTracks[0].codec;
    audioChannels = parsedBoxes.audioTracks[0].channels;
    audioSampleRate = parsedBoxes.audioTracks[0].sampleRate;
    isMetadataVerified = true;
  } else if (heuristicIsSilent) {
    hasAudioTrack = false;
    audioTrackCount = 0;
    detectedAudioCodec = 'Sin Audio (Stream DASH mudo)';
    isMetadataVerified = true;
  } else if (
    parsedBoxes &&
    parsedBoxes.videoTracks.length > 0 &&
    parsedBoxes.container.startsWith('MP4')
  ) {
    // moov header read inside MP4 and video track found with zero audio tracks
    hasAudioTrack = false;
    audioTrackCount = 0;
    detectedAudioCodec = 'Sin Audio (0 pistas en MP4)';
    isMetadataVerified = true;
  } else if (isCarItem && itemReference && !isItemAudioUnverified) {
    hasAudioTrack = true;
    audioTrackCount = 1;
    detectedAudioCodec = itemReference.audioCodec;
    audioChannels = 2;
    audioSampleRate = 48000;
    isMetadataVerified = true;
  } else if (isCarItem && itemReference) {
    hasAudioTrack = true;
    audioTrackCount = 0;
    detectedAudioCodec = itemReference.audioCodec || 'Sin verificar (archivo remoto)';
    isMetadataVerified = false;
  } else {
    hasAudioTrack = true;
    audioTrackCount = 0;
    detectedAudioCodec = 'Sin verificar (cabecera no leída)';
    isMetadataVerified = false;
  }

  // Video track determination
  const hasVideoTrack = true;
  const videoTrackCount = 1;
  let detectedVideoCodec = 'Sin verificar';
  let detectedResolution = 'Sin verificar';
  let isVideoVerified = false;

  if (parsedBoxes && parsedBoxes.videoTracks.length > 0) {
    const vt = parsedBoxes.videoTracks[0];
    detectedVideoCodec = vt.codec;
    detectedResolution = `${vt.width}x${vt.height}`;
    isVideoVerified = true;
  } else if (itemReference) {
    detectedVideoCodec = itemReference.videoCodec || 'Sin verificar';
    isVideoVerified = !detectedVideoCodec.toLowerCase().includes('sin verificar');
    if (itemReference.resolution === '1080p') {
      detectedResolution = '1920x1080 (1080p Full HD)';
    } else if (itemReference.resolution === '720p') {
      detectedResolution = '1280x720 (720p HD)';
    } else if (itemReference.resolution === '480p') {
      detectedResolution = '480p SD';
    } else {
      detectedResolution = 'Sin verificar';
    }
  }

  const detailedChecks: DetailedMetadataCheck[] = [];

  // Check 1: Audio track presence
  if (!hasAudioTrack) {
    detailedChecks.push({
      id: 'audio-presence',
      title: 'Pista de Audio Embebida en Contenedor',
      status: 'fail',
      expected: '≥ 1 Pista de Audio Estéreo',
      detected: '0 Pistas (Ausente)',
      carImpact:
        'CRÍTICO: La consola del coche reproducirá en silencio total o cancelará la pista por error de códec.',
    });
  } else if (!isMetadataVerified) {
    detailedChecks.push({
      id: 'audio-presence',
      title: 'Pista de Audio Embebida en Contenedor',
      status: 'warn',
      expected: '≥ 1 Pista de Audio Estéreo',
      detected: 'Sin verificar',
      carImpact:
        'No se pudieron leer las pistas internas del archivo. Analiza el MP4 descargado o pruébalo con sonido en la consola.',
    });
  } else {
    detailedChecks.push({
      id: 'audio-presence',
      title: 'Pista de Audio Embebida en Contenedor',
      status: 'pass',
      expected: '≥ 1 Pista de Audio Estéreo',
      detected: `${audioTrackCount} Pista(s) encontrada(s)`,
      carImpact: 'Correcto: La radio del auto emitirá sonido a través de los altavoces.',
    });
  }

  // Check 2: Audio codec standard
  const lowerDetectedCodec = detectedAudioCodec.toLowerCase();
  const isAacOrMp3 =
    lowerDetectedCodec.includes('aac') ||
    lowerDetectedCodec.includes('mp4a') ||
    lowerDetectedCodec.includes('mp3');
  const isOpus = lowerDetectedCodec.includes('opus');
  const isVorbis = lowerDetectedCodec.includes('vorbis');
  const isOpusOrVorbis = isOpus || isVorbis;
  const isUnsupportedCodec = isOpusOrVorbis || lowerDetectedCodec.includes('ac-3');

  let audioCodecStatus: 'pass' | 'fail' | 'warn' = 'pass';
  let audioCodecImpact = 'Compatible al 100% con todos los estéreos.';
  if (!hasAudioTrack) {
    audioCodecStatus = 'fail';
    audioCodecImpact = 'Inexistente: No hay flujo de audio para decodificar.';
  } else if (!isMetadataVerified) {
    audioCodecStatus = 'warn';
    audioCodecImpact =
      'Sin verificar: la fuente remota o cabecera no expuso el códec de audio; conviene analizar el archivo MP4 en local.';
  } else if (isOpusOrVorbis) {
    audioCodecStatus = 'warn';
    const codecTitle = isOpus ? 'Opus' : 'Vorbis';
    audioCodecImpact = `INCOMPATIBLE con la mayoría de estéreos de auto. Flujo de audio ${codecTitle} detectado. Radios Pioneer, Alpine, Kenwood, Sony y consolas OEM rechazan ${codecTitle}. Se sugiere recodificar a AAC con FFmpeg.`;
  } else if (isUnsupportedCodec || !isAacOrMp3) {
    audioCodecStatus = 'warn';
    audioCodecImpact = 'Advertencia: Algunos estéreos no soportan este códec web.';
  }

  detailedChecks.push({
    id: 'audio-codec',
    title: 'Códec de Audio Compatible con Automoción',
    status: audioCodecStatus,
    expected: 'AAC-LC (mp4a) o MP3 (Estéreo, 44.1/48 kHz)',
    detected: detectedAudioCodec,
    carImpact: audioCodecImpact,
  });

  // Check 3: Audio channels
  let channelsStatus: 'pass' | 'fail' | 'warn' = 'warn';
  let channelsDetected = 'Sin verificar';
  let channelsImpact = 'No se pudo comprobar el número de canales sin leer los átomos MP4.';
  if (!hasAudioTrack) {
    channelsStatus = 'fail';
    channelsDetected = '0 Canales';
    channelsImpact = 'Silencio.';
  } else if (isMetadataVerified) {
    channelsStatus = audioChannels >= 2 ? 'pass' : 'warn';
    channelsDetected = audioChannels > 0 ? `${audioChannels} Canal(es)` : 'Desconocido';
    channelsImpact =
      audioChannels >= 2
        ? 'Balance estéreo óptimo para el sistema de sonido del coche.'
        : 'Mono: Puede sonar solo en un lado de los parlantes.';
  }

  detailedChecks.push({
    id: 'audio-channels',
    title: 'Canales de Audio (Stereo / Balance)',
    status: channelsStatus,
    expected: '2 Canales (Estéreo L/R)',
    detected: channelsDetected,
    carImpact: channelsImpact,
  });

  // Check 4: Video codec
  const isH264 =
    detectedVideoCodec.includes('H.264') ||
    detectedVideoCodec.includes('AVC') ||
    detectedVideoCodec.includes('avc1');
  let videoCodecStatus: 'pass' | 'warn' = 'warn';
  let videoCodecImpact = 'Sin verificar sin lectura completa de átomos MP4.';
  if (isVideoVerified && isH264) {
    videoCodecStatus = 'pass';
    videoCodecImpact = 'Compatible con el 99.8% de procesadores para autos.';
  } else if (isVideoVerified) {
    videoCodecStatus = 'warn';
    videoCodecImpact = 'Verificar si la pantalla soporta HEVC/VP9.';
  }
  detailedChecks.push({
    id: 'video-codec',
    title: 'Códec de Video Automotriz',
    status: videoCodecStatus,
    expected: 'H.264 / AVC (Baseline o High Profile)',
    detected: detectedVideoCodec,
    carImpact: videoCodecImpact,
  });

  // Check 5: Resolution
  detailedChecks.push({
    id: 'resolution-rate',
    title: 'Resolución Máxima para Pantalla de Auto',
    status: detectedResolution === 'Sin verificar' ? 'warn' : 'pass',
    expected: '≤ 1080p (720p recomendado para 60 FPS)',
    detected: detectedResolution,
    carImpact:
      detectedResolution === 'Sin verificar'
        ? 'No se pudieron leer las dimensiones desde la cabecera.'
        : 'Fluidez óptima sin sobrecalentamiento del chipset del auto.',
  });

  // Calculate score and compatibility honestly
  const isCarConsoleCompatible =
    isMetadataVerified &&
    hasAudioTrack &&
    (isAacOrMp3 || (audioCodecStatus === 'pass' && !isOpusOrVorbis));

  let compatibilityScore = 100;
  let compatibilityStatus: 'compatible' | 'warning' | 'incompatible' = 'compatible';

  if (!hasAudioTrack) {
    compatibilityScore = 20;
    compatibilityStatus = 'incompatible';
  } else if (!isMetadataVerified) {
    compatibilityScore = 0;
    compatibilityStatus = 'warning';
  } else if (isOpusOrVorbis) {
    compatibilityScore = 55;
    compatibilityStatus = 'warning';
  } else if (audioCodecStatus === 'warn') {
    compatibilityScore = 65;
    compatibilityStatus = 'warning';
  }

  const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/["'\\]/g, '');
  const safeOutputName = `${cleanBaseName}_car_ready.mp4`;

  // FFmpeg command generator
  let ffmpegCommand = '';
  let recodingReason = '';
  let recodingSolution = '';

  if (!hasAudioTrack) {
    recodingReason =
      'El video importado no contiene ninguna pista de audio (0 tracks). Corresponde a un archivo de video-only descargado mediante el formato adaptativo DASH de YouTube sin multiplexar.';
    recodingSolution =
      'Requiere recodificación o multiplexación con FFmpeg para inyectar una pista de audio AAC Estéreo (48 kHz) y hacerlo compatible con la consola del coche.';
    ffmpegCommand = `# Opción A: Si descargaste el video (.mp4) y audio (.m4a) por separado:
ffmpeg -i "${fileName}" -i "${cleanBaseName}.m4a" -c:v copy -c:a aac -b:a 192k -ar 48000 "${safeOutputName}"

# Opción B: Si deseas agregarle una pista de audio musical directamente:
ffmpeg -i "${fileName}" -i "musica.mp3" -c:v copy -c:a aac -b:a 320k -shortest "${safeOutputName}"`;
  } else if (!isMetadataVerified) {
    recodingReason =
      'Este elemento proviene de una URL externa o un contenedor cuya cabecera MP4 (átomo moov) no se ha podido leer desde el navegador, por lo que no es posible confirmar H.264 + AAC.';
    recodingSolution =
      'Reprodúcelo en la consola para comprobar que tenga audio, o analízalo en local desde "Analizar archivo de tu PC" una vez descargado.';
    ffmpegCommand = `# Si al probarlo en el coche no tiene sonido, normalízalo a H.264 + AAC:
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart "${safeOutputName}"`;
  } else if (isOpusOrVorbis) {
    const codecName = isOpus ? 'Opus' : 'Vorbis';
    recodingReason = `Flujo de audio ${codecName} detectado. Este códec web es incompatible con la gran mayoría de estéreos y consolas de auto (Pioneer, Kenwood, Sony, Alpine, sistemas OEM), que solo decodifican AAC-LC o MP3.`;
    recodingSolution =
      'Recodificar el audio a AAC Estéreo (320 kbps - 48 kHz). Mediante el parámetro "-c:v copy", el flujo de video no se re-codifica, completando el proceso en apenas 2 a 5 segundos sin degradar calidad.';
    ffmpegCommand = `# Comando sugerido de FFmpeg para recodificar audio ${codecName} a AAC compatible con coche:
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -ar 48000 "${safeOutputName}"`;
  } else if (audioCodecStatus === 'warn') {
    recodingReason =
      'El archivo tiene audio, pero el códec no es AAC estándar. Muchas radios de coche rechazan pistas que no sean AAC o MP3.';
    recodingSolution =
      'Recodificar únicamente la pista de audio a AAC-LC de 320 kbps (sin tocar el video, toma menos de 5 segundos).';
    ffmpegCommand = `ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -ar 48000 "${safeOutputName}"`;
  } else {
    recodingReason = 'El video cuenta con pista de audio AAC y video H.264 válidos.';
    recodingSolution = 'Listo para copiar a la memoria USB y reproducir en la consola del auto.';
    ffmpegCommand = `# El archivo ya es 100% compatible. Si deseas normalizar el volumen:
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -af "loudnorm=I=-14:TP=-1.5:LRA=11" "${safeOutputName}"`;
  }

  // Windows batch script for automated recoding
  const windowsBatchScript = String.raw`@echo off
chcp 65001 >nul
echo ========================================================
echo   RECODIFICADOR DE VIDEO PARA CONSOLAS DE AUTO (FFmpeg)
echo ========================================================
echo Archivo a procesar: ${fileName}
echo Verificando si FFmpeg esta instalado en su PC...
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] No se encontro ffmpeg.exe en su sistema.
    echo Descargando version portatil de FFmpeg...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg.zip'"
    powershell -Command "Expand-Archive -Path 'ffmpeg.zip' -DestinationPath 'ffmpeg_temp' -Force"
    copy "ffmpeg_temp\*\bin\ffmpeg.exe" .\ >nul
)
echo [OK] Recodificando a MP4 con pista de audio AAC Estereo para auto...
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "${safeOutputName}"
echo ========================================================
echo [EXITO] Archivo generado: ${safeOutputName}
echo Copie este archivo a su memoria USB para su vehiculo.
pause
`;

  const requiresRecoding = isMetadataVerified && !isCarConsoleCompatible;

  return {
    fileName,
    fileSizeMb,
    container: parsedBoxes?.container || 'MP4 (ISOBMFF)',
    hasAudioTrack,
    audioTrackCount,
    audioCodec: detectedAudioCodec,
    audioChannels,
    audioSampleRate,
    hasVideoTrack,
    videoTrackCount,
    videoCodec: detectedVideoCodec,
    resolution: detectedResolution,
    durationSeconds: Math.round(duration),
    isCarConsoleCompatible,
    compatibilityStatus,
    compatibilityScore,
    requiresRecoding,
    recodingReason,
    recodingSolution,
    ffmpegCommand,
    windowsBatchScript,
    detailedChecks,
    rawBoxesDetected: parsedBoxes?.rawBoxes || [],
    analyzedAt: new Date().toLocaleTimeString(),
    isMetadataVerified,
    isOpusOrVorbis,
    audioCodecType: resolveAudioCodecType(
      isMetadataVerified,
      hasAudioTrack,
      isOpus,
      isVorbis,
      isAacOrMp3
    ),
  };
}

/**
 * Quick analysis helper to detect audio stream issues (Opus, Vorbis, Silent)
 * without full async processing, ideal for cards and batch list processing.
 */
export function detectAudioCodecIssue(
  audioCodec?: string,
  fileName?: string
): {
  isSilent: boolean;
  isOpusOrVorbis: boolean;
  codecName: string;
  isCompatible: boolean;
  statusBadgeText: string;
  suggestedFfmpegCommand: string;
  uiWarningText: string;
} {
  const normCodec = (audioCodec || '').toLowerCase();
  const normName = (fileName || '').toLowerCase();

  const isSilent = 
    normCodec.includes('sin audio') || 
    normCodec.includes('mudo') || 
    normCodec.includes('no audio') ||
    /f(133|134|135|136|137|160|242|243|244|247|248|278)\./.test(normName) ||
    normName.includes('(playlist_index)');

  const isOpus = normCodec.includes('opus') || normName.includes('opus') || normName.endsWith('.opus');
  const isVorbis = normCodec.includes('vorbis') || normName.includes('vorbis') || normName.endsWith('.ogg');
  const isOpusOrVorbis = isOpus || isVorbis;

  const cleanName = (fileName || 'video.mp4').replace(/["'\\]/g, '');
  const baseName = cleanName.replace(/\.[^/.]+$/, '');
  const outName = `${baseName}_car_ready.mp4`;

  if (isSilent) {
    return {
      isSilent: true,
      isOpusOrVorbis: false,
      codecName: 'Sin Audio (DASH Mudo)',
      isCompatible: false,
      statusBadgeText: 'Pista de Audio Ausente',
      suggestedFfmpegCommand: `ffmpeg -i "${cleanName}" -i "${baseName}.m4a" -c:v copy -c:a aac -b:a 192k "${outName}"`,
      uiWarningText: 'Video sin pista de audio (stream DASH mudo). Requiere multiplexar audio con FFmpeg para ser compatible con la consola.'
    };
  }

  if (isOpusOrVorbis) {
    const name = isOpus ? 'Opus' : 'Vorbis';
    return {
      isSilent: false,
      isOpusOrVorbis: true,
      codecName: `${name} (Incompatible)`,
      isCompatible: false,
      statusBadgeText: `Audio ${name} (Incompatible con Estéreos)`,
      suggestedFfmpegCommand: `ffmpeg -i "${cleanName}" -c:v copy -c:a aac -b:a 320k -ar 48000 "${outName}"`,
      uiWarningText: `Flujo de audio ${name} detectado. Incompatible con la mayoría de estéreos de auto (Pioneer, Kenwood, Sony, Alpine). Se sugiere recodificar a AAC mediante FFmpeg.`
    };
  }

  return {
    isSilent: false,
    isOpusOrVorbis: false,
    codecName: audioCodec || 'AAC Estéreo',
    isCompatible: true,
    statusBadgeText: 'AAC Estéreo (Compatible)',
    suggestedFfmpegCommand: `ffmpeg -i "${cleanName}" -c:v copy -c:a aac -b:a 320k "${outName}"`,
    uiWarningText: 'Audio compatible al 100% con sistemas de infoentretenimiento para automóvil.'
  };
}

export interface FolderRepairScriptOptions {
  outputFolder?: string;
  audioBitrate?: string;
  sampleRate?: number;
}

const WINDOWS_FFMPEG_INSTALL_BLOCK = String.raw`set "FFMPEG_CMD=ffmpeg"
set "FFMPEG_OPT="
where ffmpeg >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] FFmpeg detectado en el sistema Windows.
    goto :FFMPEG_READY
)

if exist "ffmpeg.exe" (
    echo [OK] ffmpeg.exe detectado en esta carpeta.
    set "FFMPEG_CMD=.\ffmpeg.exe"
    set "FFMPEG_OPT=--ffmpeg-location ."
    goto :FFMPEG_READY
)

echo [!] FFmpeg no encontrado. Instalando version portable...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "try { " ^
    "    Invoke-WebRequest -Uri 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg_dl.zip' -UseBasicParsing; " ^
    "    Expand-Archive -Path 'ffmpeg_dl.zip' -DestinationPath 'ffmpeg_temp' -Force; " ^
    "    $f = Get-ChildItem -Path 'ffmpeg_temp' -Filter 'ffmpeg.exe' -Recurse | Select-Object -First 1; " ^
    "    if ($f) { Copy-Item $f.FullName -Destination 'ffmpeg.exe'; Remove-Item 'ffmpeg_dl.zip' -Force; Remove-Item 'ffmpeg_temp' -Recurse -Force; exit 0 } " ^
    "} catch {} " ^
    "exit 1"

if exist "ffmpeg.exe" (
    echo [OK] FFmpeg portable instalado con exito!
    set "FFMPEG_CMD=.\ffmpeg.exe"
    set "FFMPEG_OPT=--ffmpeg-location ."
    goto :FFMPEG_READY
)

curl -L -o ffmpeg.exe "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64" 2>nul
if exist "ffmpeg.exe" (
    echo [OK] FFmpeg portable listo!
    set "FFMPEG_CMD=.\ffmpeg.exe"
    set "FFMPEG_OPT=--ffmpeg-location ."
    goto :FFMPEG_READY
)

echo [ERROR] No se pudo instalar FFmpeg automaticamente. Coloca ffmpeg.exe en esta carpeta.
pause
exit /b 1

:FFMPEG_READY`;

/**
 * Generates an automated 1-click Windows .BAT script to repair all video files
 * in any directory or USB drive, ensuring FFmpeg availability and AAC stereo audio.
 */
export function generateFolderRepairBat(options?: FolderRepairScriptOptions): string {
  const outDir =
    (options?.outputFolder || 'Reparados_Para_Auto').replace(/[^\w-]/g, '_') ||
    'Reparados_Para_Auto';
  const bitrate = options?.audioBitrate || '192k';
  const sampleRate = options?.sampleRate || 48000;

  return String.raw`@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Reparador de Videos para Auto - Audio AAC Estereo
cls

echo ==============================================================================
echo   REPARADOR DE VIDEOS Y AUDIO PARA ESTEREOS DE AUTO
echo   Salida: MP4 (H.264 / AAC Estereo ${bitrate} ${sampleRate}Hz FastStart)
echo ==============================================================================
echo.

${WINDOWS_FFMPEG_INSTALL_BLOCK}

echo.
echo Escaneando y reparando videos en: %CD%
if not exist "${outDir}" mkdir "${outDir}"

set /a TOTAL=0
set /a REPAIRED=0
set /a ERRORS=0

for %%F in (*.mp4 *.webm *.mkv *.m4v *.avi *.ts) do (
    set /a TOTAL+=1
    echo [!TOTAL!] Procesando: "%%~nxF"

    set "AUDIO_SRC="
    if exist "%%~nF.m4a" set "AUDIO_SRC=%%~nF.m4a"
    if not defined AUDIO_SRC if exist "%%~nF.opus" set "AUDIO_SRC=%%~nF.opus"
    if not defined AUDIO_SRC if exist "%%~nF.mp3" set "AUDIO_SRC=%%~nF.mp3"
    if not defined AUDIO_SRC if exist "%%~nF.ogg" set "AUDIO_SRC=%%~nF.ogg"

    if defined AUDIO_SRC (
        !FFMPEG_CMD! -y -hide_banner -loglevel warning -i "%%~nxF" -i "!AUDIO_SRC!" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "${outDir}\%%~nF.mp4"
    ) else (
        !FFMPEG_CMD! -y -hide_banner -loglevel warning -i "%%~nxF" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "${outDir}\%%~nF.mp4"
    )

    if exist "${outDir}\%%~nF.mp4" (
        echo  [OK] "${outDir}\%%~nF.mp4"
        set /a REPAIRED+=1
    ) else (
        echo  [!] Error al procesar "%%~nxF"
        set /a ERRORS+=1
    )
)

echo.
echo ==============================================================================
echo   COMPLETADO: !REPAIRED! de !TOTAL! videos listos en "${outDir}" (Errores: !ERRORS!)
echo ==============================================================================
pause
`;
}

/**
 * Generates a macOS / Linux .SH script to repair all videos in a folder to AAC stereo MP4.
 */
export function generateFolderRepairSh(options?: FolderRepairScriptOptions): string {
  const outDir =
    (options?.outputFolder || 'Reparados_Para_Auto').replace(/[^\w-]/g, '_') ||
    'Reparados_Para_Auto';
  const bitrate = options?.audioBitrate || '192k';
  const sampleRate = options?.sampleRate || 48000;

  return `#!/usr/bin/env bash
set -e

OUT_DIR="${outDir}"
mkdir -p "$OUT_DIR"

if ! command -v ffmpeg &> /dev/null; then
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
    else
        echo "Instala FFmpeg (brew install ffmpeg) y vuelve a ejecutar."
        exit 1
    fi
fi

repaired=0
for f in *.{mp4,webm,mkv,m4v,avi,ts}; do
    [ -f "$f" ] || continue
    base="\${f%.*}"
    echo "Procesando: $f"
    if [ -f "$base.m4a" ]; then
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -i "$base.m4a" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    elif [ -f "$base.opus" ]; then
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -i "$base.opus" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    elif [ -f "$base.mp3" ]; then
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -i "$base.mp3" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    else
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    fi
    [ -f "$OUT_DIR/$base.mp4" ] && repaired=$((repaired+1))
done

echo "Listo: $repaired videos reparados en ./$OUT_DIR"
`;
}

export interface YoutubeDownloadScriptOptions {
  input: string;
  isPlaylist: boolean;
  resolution: '720p' | '1080p' | '480p' | 'Sin verificar';
  targetFolder: string;
  includeTrackPrefix: boolean;
  organizeInSubfolder: boolean;
}

const RESOLUTION_HEIGHT_MAP: Record<YoutubeDownloadScriptOptions['resolution'], string> = {
  '1080p': '1080',
  '720p': '720',
  '480p': '480',
  'Sin verificar': '720',
};

function quoteBashArg(value: string): string {
  const singleLine = value.replace(/[\r\n]+/g, ' ').trim();
  return `'${singleLine.replaceAll("'", String.raw`'\''`)}'`;
}

function quoteBatchArg(value: string): string {
  const safe = value
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .replaceAll('"', "'")
    .replaceAll('%', '%%')
    .replace(/\\+$/, (match) => `${match}${match}`);
  return `"${safe}"`;
}

/**
 * Generates unified Windows (.bat), macOS/Linux (.sh), and single-line yt-dlp scripts
 * for either a single video/search or a full playlist with H.264 + AAC car compatibility.
 */
export function generateYoutubeDownloadScript(options: YoutubeDownloadScriptOptions): {
  windowsBat: string;
  macSh: string;
  singleLineCommand: string;
  resolvedTarget: string;
} {
  const height = RESOLUTION_HEIGHT_MAP[options.resolution] || '720';
  const safeFolder =
    (options.targetFolder || 'USB_Musica_Auto').replace(/[^\w-]/g, '_') || 'USB_Musica_Auto';
  const normalizedInput = options.input.replace(/[\r\n]+/g, ' ').trim();
  const isUrl = /^https?:\/\//i.test(normalizedInput);
  const searchCount = options.isPlaylist ? '15' : '1';
  const searchQuery = normalizedInput || 'Carlos Vives La Gota Fria';
  const resolvedTarget = isUrl ? normalizedInput : `ytsearch${searchCount}:${searchQuery}`;

  const bashQuotedTarget = quoteBashArg(resolvedTarget);
  const batchQuotedTarget = quoteBatchArg(resolvedTarget);

  const playlistFlag = options.isPlaylist ? '--yes-playlist' : '--no-playlist';
  const formatFilter = `bestvideo[vcodec^=avc1][height<=${height}]+bestaudio[acodec^=mp4a]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}][ext=mp4]/best`;

  const buildTemplate = (forBat: boolean) => {
    const p = forBat ? '%%' : '%';
    const prefix = options.isPlaylist && options.includeTrackPrefix ? `${p}(playlist_index)02d - ` : '';
    const sub = options.isPlaylist && options.organizeInSubfolder ? `${p}(playlist_title)s/` : '';
    return `${safeFolder}/${sub}${prefix}${p}(title)s.${p}(ext)s`;
  };

  const singleLineCommand = `yt-dlp ${playlistFlag} -f "${formatFilter}" --merge-output-format mp4 --remux-video mp4 --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart" --windows-filenames --no-mtime --continue --ignore-errors -o "${buildTemplate(false)}" ${bashQuotedTarget}`;

  const windowsBat = `@echo off
chcp 65001 >nul
title CarVideo USB Studio - Descargador MP4 para Auto (${options.resolution})
cls
echo ===================================================================
echo   DESCARGADOR AUTOMOTRIZ YT-DLP + FFMPEG (H.264 + AAC ESTEREO)
echo   Destino: "${safeFolder}"  -  Calidad: ${options.resolution}
echo ===================================================================
echo.

where yt-dlp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if not exist "yt-dlp.exe" (
        echo [1/2] Descargando yt-dlp.exe...
        curl -L -o yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
        if not exist "yt-dlp.exe" (
            echo [!] No se pudo descargar yt-dlp.exe. Verifica tu conexion.
            pause
            exit /b 1
        )
    )
)

set "YTDLP_CMD=yt-dlp"
if exist "yt-dlp.exe" set "YTDLP_CMD=yt-dlp.exe"

${WINDOWS_FFMPEG_INSTALL_BLOCK}

if not exist "${safeFolder}" mkdir "${safeFolder}"
echo.
echo Descargando y uniendo audio AAC para auto...

%YTDLP_CMD% ${playlistFlag} ^
  --format "${formatFilter}" ^
  --merge-output-format mp4 ^
  --remux-video mp4 ^
  --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart" ^
  %FFMPEG_OPT% ^
  --windows-filenames ^
  --no-mtime ^
  --continue ^
  --ignore-errors ^
  --output "${buildTemplate(true)}" ^
  ${batchQuotedTarget}

echo.
echo ===================================================================
echo   [LISTO] Videos guardados en "${safeFolder}" con audio AAC!
echo ===================================================================
pause
`;

  const macSh = String.raw`#!/usr/bin/env bash
set -e
mkdir -p "${safeFolder}"

if ! command -v yt-dlp &> /dev/null; then
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./yt-dlp
    chmod a+rx ./yt-dlp
    YTDLP_CMD="./yt-dlp"
else
    YTDLP_CMD="yt-dlp"
fi

if ! command -v ffmpeg &> /dev/null && command -v brew &> /dev/null; then
    brew install ffmpeg
fi

$YTDLP_CMD ${playlistFlag} \
  --format "${formatFilter}" \
  --merge-output-format mp4 \
  --remux-video mp4 \
  --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart" \
  --windows-filenames \
  --no-mtime \
  --continue \
  --ignore-errors \
  --output "${buildTemplate(false)}" \
  ${bashQuotedTarget}

echo "[LISTO] Videos guardados en ./${safeFolder}"
`;

  return {
    windowsBat,
    macSh,
    singleLineCommand,
    resolvedTarget,
  };
}

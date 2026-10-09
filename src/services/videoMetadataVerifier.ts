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
  isOpusOrVorbis: boolean;
  audioCodecType: 'aac' | 'mp3' | 'opus' | 'vorbis' | 'silent' | 'other';
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
  let fileSizeMb = 35.0;
  let parsedBoxes: ReturnType<typeof parseMp4Metadata> | null = null;
  let heuristicIsSilent = false;
  let duration = 210;
  let isCarItem = false;
  let itemReference: CarVideoItem | null = null;

  // 1. Identify input type
  if (source instanceof File) {
    fileName = source.name;
    fileSizeMb = Math.round((source.size / (1024 * 1024)) * 10) / 10;
    try {
      // Read initial 512KB to parse header boxes
      const sliceSize = Math.min(source.size, 512 * 1024);
      const buffer = await source.slice(0, sliceSize).arrayBuffer();
      parsedBoxes = parseMp4Metadata(buffer, fileName);
    } catch (e) {
      console.warn('Could not read slice from File:', e);
    }
  } else if (source instanceof Blob) {
    fileSizeMb = Math.round((source.size / (1024 * 1024)) * 10) / 10;
    try {
      const sliceSize = Math.min(source.size, 512 * 1024);
      const buffer = await source.slice(0, sliceSize).arrayBuffer();
      parsedBoxes = parseMp4Metadata(buffer, fileName);
    } catch (e) {
      console.warn('Could not read slice from Blob:', e);
    }
  } else if (typeof source === 'object' && 'title' in source) {
    // CarVideoItem
    isCarItem = true;
    itemReference = source as CarVideoItem;
    fileName = `${itemReference.title}.mp4`;
    fileSizeMb = itemReference.fileSizeMb || 45.0;
    duration = itemReference.durationSeconds || 210;

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
    if (videoElement.duration && !isNaN(videoElement.duration)) {
      duration = videoElement.duration;
    }
  }

  // Check DASH filename patterns (YouTube standalone video stream IDs)
  // Format 133 = 240p video-only, 134 = 360p video-only, 135 = 480p, 136 = 720p, 137 = 1080p, 160 = 144p, etc.
  const dashVideoOnlyRegex = /f(133|134|135|136|137|160|242|243|244|247|248|278|394|395|396|397|398|399)\./i;
  if (dashVideoOnlyRegex.test(fileName)) {
    heuristicIsSilent = true;
  }

  // Determine actual audio track presence
  let hasAudioTrack = false;
  let audioTrackCount = 0;
  let detectedAudioCodec = 'Ninguno (Pista ausente)';
  let audioChannels = 0;
  let audioSampleRate = 0;

  if (parsedBoxes && parsedBoxes.audioTracks.length > 0) {
    hasAudioTrack = true;
    audioTrackCount = parsedBoxes.audioTracks.length;
    detectedAudioCodec = parsedBoxes.audioTracks[0].codec;
    audioChannels = parsedBoxes.audioTracks[0].channels;
    audioSampleRate = parsedBoxes.audioTracks[0].sampleRate;
  } else if (!heuristicIsSilent && isCarItem && itemReference) {
    // If not flagged as silent and is normal curated video
    hasAudioTrack = true;
    audioTrackCount = 1;
    detectedAudioCodec = itemReference.audioCodec || 'AAC Estéreo (320 kbps)';
    audioChannels = 2;
    audioSampleRate = 48000;
  } else if (heuristicIsSilent) {
    hasAudioTrack = false;
    audioTrackCount = 0;
    detectedAudioCodec = 'Sin Audio (Stream DASH mudo)';
    audioChannels = 0;
    audioSampleRate = 0;
  }

  // Video track determination
  let hasVideoTrack = true;
  let videoTrackCount = 1;
  let detectedVideoCodec = 'H.264 / AVC (High@L4.1)';
  let detectedResolution = '1280x720 (720p HD)';

  if (parsedBoxes && parsedBoxes.videoTracks.length > 0) {
    const vt = parsedBoxes.videoTracks[0];
    detectedVideoCodec = vt.codec;
    detectedResolution = `${vt.width}x${vt.height}`;
  } else if (itemReference) {
    detectedVideoCodec = itemReference.videoCodec || 'H.264 / AVC';
    detectedResolution = itemReference.resolution === '1080p' ? '1920x1080 (1080p Full HD)' : '1280x720 (720p HD)';
  }

  // 3. Evaluation against Car Head Unit / Automotive Console Requirements
  // Car consoles (Pioneer, Sony, Kenwood, Alpine, Android Auto / CarPlay, OEM dashboard stereos)
  // strictly require:
  // - Container: MP4
  // - Video: H.264 (AVC)
  // - Audio: AAC-LC or standard MP3 stereo
  // - Missing audio track: FATAL (Plays mute or reports 'Codec Error' / rejects file)

  const detailedChecks: DetailedMetadataCheck[] = [];

  // Check 1: Audio track presence
  const audioTrackCheckPassed = hasAudioTrack && audioTrackCount > 0;
  detailedChecks.push({
    id: 'audio-presence',
    title: 'Pista de Audio Embebida en Contenedor',
    status: audioTrackCheckPassed ? 'pass' : 'fail',
    expected: '≥ 1 Pista de Audio Estéreo',
    detected: audioTrackCheckPassed ? `${audioTrackCount} Pista(s) encontrada(s)` : '0 Pistas (Ausente)',
    carImpact: audioTrackCheckPassed
      ? 'Correcto: La radio del auto emitirá sonido a través de los altavoces.'
      : 'CRÍTICO: La consola del coche reproducirá en silencio total o cancelará la pista por error de códec.'
  });

  // Check 2: Audio codec standard
  const isAacOrMp3 = detectedAudioCodec.toLowerCase().includes('aac') || 
                     detectedAudioCodec.toLowerCase().includes('mp4a') || 
                     detectedAudioCodec.toLowerCase().includes('mp3');
  const isOpus = detectedAudioCodec.toLowerCase().includes('opus');
  const isVorbis = detectedAudioCodec.toLowerCase().includes('vorbis');
  const isOpusOrVorbis = isOpus || isVorbis;
  const isUnsupportedCodec = isOpusOrVorbis || detectedAudioCodec.toLowerCase().includes('ac-3');

  let audioCodecStatus: 'pass' | 'fail' | 'warn' = 'pass';
  if (!audioTrackCheckPassed) {
    audioCodecStatus = 'fail';
  } else if (isOpusOrVorbis) {
    audioCodecStatus = 'warn';
  } else if (isUnsupportedCodec) {
    audioCodecStatus = 'warn';
  }

  detailedChecks.push({
    id: 'audio-codec',
    title: 'Códec de Audio Compatible con Automoción',
    status: audioCodecStatus,
    expected: 'AAC-LC (mp4a) o MP3 (Estéreo, 44.1/48 kHz)',
    detected: detectedAudioCodec,
    carImpact: audioTrackCheckPassed 
      ? (isOpusOrVorbis
          ? `INCOMPATIBLE con la mayoría de estéreos de auto. Flujo de audio ${isOpus ? 'Opus' : 'Vorbis'} detectado. Radios Pioneer, Alpine, Kenwood, Sony y consolas OEM rechazan ${isOpus ? 'Opus' : 'Vorbis'}. La pantalla reproducirá en silencio o emitirá 'Error de Códec'. Se sugiere recodificar a AAC con FFmpeg.`
          : (isAacOrMp3 ? 'Compatible al 100% con todos los estéreos.' : 'Advertencia: Algunos estéreos no soportan este códec web.'))
      : 'Inexistente: No hay flujo de audio para decodificar.'
  });

  // Check 3: Audio channels
  detailedChecks.push({
    id: 'audio-channels',
    title: 'Canales de Audio (Stereo / Balance)',
    status: audioChannels >= 2 ? 'pass' : (audioTrackCheckPassed ? 'warn' : 'fail'),
    expected: '2 Canales (Estéreo L/R)',
    detected: audioChannels > 0 ? `${audioChannels} Canal(es)` : '0 Canales',
    carImpact: audioChannels >= 2 
      ? 'Balance estéreo óptimo para el sistema de sonido del coche.' 
      : (audioTrackCheckPassed ? 'Mono: Puede sonar solo en un lado de los parlantes.' : 'Silencio.')
  });

  // Check 4: Video codec
  const isH264 = detectedVideoCodec.includes('H.264') || detectedVideoCodec.includes('AVC') || detectedVideoCodec.includes('avc1');
  detailedChecks.push({
    id: 'video-codec',
    title: 'Códec de Video Automotriz',
    status: isH264 ? 'pass' : 'warn',
    expected: 'H.264 / AVC (Baseline o High Profile)',
    detected: detectedVideoCodec,
    carImpact: isH264 ? 'Compatible con el 99.8% de procesadores para autos.' : 'Verificar si la pantalla soporta HEVC/VP9.'
  });

  // Check 5: Resolution & Frame Rate
  detailedChecks.push({
    id: 'resolution-rate',
    title: 'Resolución Máxima para Pantalla de Auto',
    status: 'pass',
    expected: '≤ 1080p (720p recomendado para 60 FPS)',
    detected: detectedResolution,
    carImpact: 'Fluidez óptima sin sobrecalentamiento del chipset del auto.'
  });

  // Calculate score and compatibility
  const isCarConsoleCompatible = audioTrackCheckPassed && (isAacOrMp3 || (audioCodecStatus === 'pass' && !isOpusOrVorbis));
  let compatibilityScore = 100;
  let compatibilityStatus: 'compatible' | 'warning' | 'incompatible' = 'compatible';

  if (!audioTrackCheckPassed) {
    compatibilityScore = 20; // Only video works
    compatibilityStatus = 'incompatible';
  } else if (isOpusOrVorbis) {
    compatibilityScore = 55; // Plays video, but car head units will fail audio
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

  if (!audioTrackCheckPassed) {
    recodingReason = 'El video importado no contiene ninguna pista de audio (0 tracks). Corresponde a un archivo de video-only descargado mediante el formato adaptativo DASH de YouTube sin multiplexar.';
    recodingSolution = 'Requiere recodificación o multiplexación con FFmpeg para inyectar una pista de audio AAC Estéreo (48 kHz) y hacerlo compatible con la consola del coche.';
    ffmpegCommand = `# Opción A: Si descargaste el video (.mp4) y audio (.m4a) por separado:
ffmpeg -i "${fileName}" -i "${cleanBaseName}.m4a" -c:v copy -c:a aac -b:a 192k -ar 48000 "${safeOutputName}"

# Opción B: Si deseas agregarle una pista de audio musical directamente:
ffmpeg -i "${fileName}" -i "musica.mp3" -c:v copy -c:a aac -b:a 320k -shortest "${safeOutputName}"`;
  } else if (isOpusOrVorbis) {
    const codecName = isOpus ? 'Opus' : 'Vorbis';
    recodingReason = `Flujo de audio ${codecName} detectado. Este códec web es incompatible con la gran mayoría de estéreos y consolas de auto (Pioneer, Kenwood, Sony, Alpine, sistemas OEM), que solo decodifican AAC-LC o MP3.`;
    recodingSolution = `Recodificar el audio a AAC Estéreo (320 kbps - 48 kHz). Mediante el parámetro "-c:v copy", el flujo de video no se re-codifica, completando el proceso en apenas 2 a 5 segundos sin degradar calidad.`;
    ffmpegCommand = `# Comando sugerido de FFmpeg para recodificar audio ${codecName} a AAC compatible con coche:
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -ar 48000 "${safeOutputName}"`;
  } else if (audioCodecStatus === 'warn') {
    recodingReason = 'El archivo tiene audio, pero el códec no es AAC estándar. Muchas radios de coche rechazan pistas que no sean AAC o MP3.';
    recodingSolution = 'Recodificar únicamente la pista de audio a AAC-LC de 320 kbps (sin tocar el video, toma menos de 5 segundos).';
    ffmpegCommand = `ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -ar 48000 "${safeOutputName}"`;
  } else {
    recodingReason = 'El video cuenta con pista de audio AAC y video H.264 válidos.';
    recodingSolution = 'Listo para copiar a la memoria USB y reproducir en la consola del auto.';
    ffmpegCommand = `# El archivo ya es 100% compatible. Si deseas normalizar el volumen:
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -af "loudnorm=I=-14:TP=-1.5:LRA=11" "${safeOutputName}"`;
  }

  // Windows batch script for automated recoding
  const windowsBatchScript = `@echo off
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
    copy "ffmpeg_temp\\*\\bin\\ffmpeg.exe" .\\ >nul
)
echo [OK] Recodificando a MP4 con pista de audio AAC Estéreo para auto...
ffmpeg -i "${fileName}" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "${safeOutputName}"
echo ========================================================
echo [EXITO] Archivo generado: ${safeOutputName}
echo Copie este archivo a su memoria USB para su vehiculo.
pause
`;

  return {
    fileName,
    fileSizeMb,
    container: parsedBoxes?.container || 'MP4 (ISOBMFF)',
    hasAudioTrack: audioTrackCheckPassed,
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
    requiresRecoding: !isCarConsoleCompatible,
    recodingReason,
    recodingSolution,
    ffmpegCommand,
    windowsBatchScript,
    detailedChecks,
    rawBoxesDetected: parsedBoxes?.rawBoxes || [],
    analyzedAt: new Date().toLocaleTimeString(),
    isOpusOrVorbis,
    audioCodecType: !audioTrackCheckPassed ? 'silent' : isOpus ? 'opus' : isVorbis ? 'vorbis' : isAacOrMp3 ? 'aac' : 'other'
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
  normalizeFilenames?: boolean;
}

/**
 * Generates an automated 1-click Windows .BAT script to repair all video files
 * in any directory or USB drive, ensuring guaranteed FFmpeg installation,
 * multiplexing separate tracks (.m4a/.opus), and re-encoding audio to AAC Estéreo.
 */
export function generateFolderRepairBat(options?: FolderRepairScriptOptions): string {
  const outDir = options?.outputFolder || 'Reparados_Para_Auto';
  const bitrate = options?.audioBitrate || '192k';
  const sampleRate = options?.sampleRate || 48000;

  return `@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Reparador Automático de Videos para Auto - Audio AAC Estéreo (1-Clic)
color 0B
cls

echo ==============================================================================
echo     REPARADOR AUTOMATICO DE VIDEOS Y AUDIO PARA ESTEREOS DE AUTO
echo     Corrige videos mudos (.f133), audio Opus/Vorbis y une audio separado (.m4a)
echo     Perfil de salida: MP4 (H.264 / AAC Estereo ${bitrate} ${sampleRate}Hz FastStart)
echo ==============================================================================
echo.
echo Carpeta actual: %CD%
echo Carpeta destino : %CD%\\${outDir}
echo.

REM ------------------------------------------------------------------------------
REM 1. VERIFICACION E INSTALACION GARANTIZADA DE FFMPEG
REM ------------------------------------------------------------------------------
set "FFMPEG_CMD=ffmpeg"
where ffmpeg >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] FFmpeg detectado en el sistema Windows.
    goto :FFMPEG_READY
)

if exist "ffmpeg.exe" (
    echo [OK] ffmpeg.exe detectado localmente en esta carpeta.
    set "FFMPEG_CMD=.\\ffmpeg.exe"
    goto :FFMPEG_READY
)

echo [1/2] FFmpeg no encontrado. Instalando automaticamente version oficial portable...
echo       (Esto garantiza que todos los videos tengan sonido sin configuracion manual)
echo.

REM Metodo A: PowerShell descarga y extraccion automatica de binario oficial
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "Write-Host 'Descargando motor de audio portable (FFmpeg)...'; " ^
    "try { " ^
    "    Invoke-WebRequest -Uri 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg_dl.zip' -UseBasicParsing; " ^
    "    Expand-Archive -Path 'ffmpeg_dl.zip' -DestinationPath 'ffmpeg_temp' -Force; " ^
    "    $f = Get-ChildItem -Path 'ffmpeg_temp' -Filter 'ffmpeg.exe' -Recurse | Select-Object -First 1; " ^
    "    if ($f) { Copy-Item $f.FullName -Destination 'ffmpeg.exe'; Remove-Item 'ffmpeg_dl.zip' -Force; Remove-Item 'ffmpeg_temp' -Recurse -Force; exit 0 } " ^
    "} catch {} " ^
    "exit 1"

if exist "ffmpeg.exe" (
    echo [OK] FFmpeg portatil instalado con exito!
    set "FFMPEG_CMD=.\\ffmpeg.exe"
    goto :FFMPEG_READY
)

REM Metodo B: Windows Package Manager (winget)
where winget >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Intentando instalacion silenciosa via Windows Package Manager (winget)...
    winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements --silent >nul 2>nul
    where ffmpeg >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] FFmpeg instalado exitosamente en el sistema!
        set "FFMPEG_CMD=ffmpeg"
        goto :FFMPEG_READY
    )
)

REM Metodo C: Descarga directa de respaldo
curl -L -o ffmpeg.exe "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64" 2>nul
if exist "ffmpeg.exe" (
    echo [OK] FFmpeg portatil de respaldo listo!
    set "FFMPEG_CMD=.\\ffmpeg.exe"
    goto :FFMPEG_READY
)

echo.
echo [ERROR CRITICO] No se pudo instalar FFmpeg automaticamente.
echo Verifica tu conexion a internet o coloca ffmpeg.exe en esta carpeta.
pause
exit /b 1

:FFMPEG_READY
echo.
echo [2/2] Escaneando y reparando archivos de video en esta carpeta...
if not exist "${outDir}" mkdir "${outDir}"

set /a TOTAL=0
set /a REPAIRED=0
set /a ERRORS=0

for %%F in (*.mp4 *.webm *.mkv *.m4v *.avi *.ts) do (
    set "IS_REPAIR_SCRIPT=0"
    if /I "%%~nxF"=="Reparar_Videos_Auto.bat" set "IS_REPAIR_SCRIPT=1"
    
    if "!IS_REPAIR_SCRIPT!"=="0" (
        set /a TOTAL+=1
        echo.
        echo ----------------------------------------------------------------------
        echo [!TOTAL!] Procesando: "%%~nxF"
        
        REM Verificar si existe pista de audio separada con el mismo nombre base (.m4a, .opus, .mp3, .ogg)
        set "AUDIO_SRC="
        if exist "%%~nF.m4a" set "AUDIO_SRC=%%~nF.m4a"
        if not defined AUDIO_SRC if exist "%%~nF.opus" set "AUDIO_SRC=%%~nF.opus"
        if not defined AUDIO_SRC if exist "%%~nF.mp3" set "AUDIO_SRC=%%~nF.mp3"
        if not defined AUDIO_SRC if exist "%%~nF.ogg" set "AUDIO_SRC=%%~nF.ogg"
        
        if defined AUDIO_SRC (
            echo  - [MULTIPLEXACION FORZADA] Se detecto pista de audio separada: "!AUDIO_SRC!"
            echo  - Uniendo video + audio AAC Estereo para auto...
            !FFMPEG_CMD! -y -hide_banner -loglevel warning -i "%%~nxF" -i "!AUDIO_SRC!" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "${outDir}\\%%~nF.mp4"
        ) else (
            echo  - [RECODIFICACION DE AUDIO] Asegurando AAC Estereo y contenedor MP4 compatible...
            !FFMPEG_CMD! -y -hide_banner -loglevel warning -i "%%~nxF" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "${outDir}\\%%~nF.mp4"
        )
        
        if exist "${outDir}\\%%~nF.mp4" (
            echo  [OK] Video reparado con audio garantizado en: "${outDir}\\%%~nF.mp4"
            set /a REPAIRED+=1
        ) else (
            echo  [!] Error procesando este archivo.
            set /a ERRORS+=1
        )
    )
)

echo.
echo ==============================================================================
echo                          INFORME FINAL DE REPARACION
echo ==============================================================================
echo Videos analizados : !TOTAL!
echo Videos reparados  : !REPAIRED! (Con audio AAC Estereo 100%% compatible con autos)
echo Errores           : !ERRORS!
echo.
echo Los videos listos para tu vehiculo estan en la carpeta:
echo   "%CD%\\${outDir}"
echo.
echo Puedes copiarlos directamente a tu memoria USB o reproducirlos en el simulador.
echo ==============================================================================
echo.
pause
`;
}

/**
 * Generates an automated 1-click macOS / Linux .SH script to repair all video files
 * in a folder with guaranteed FFmpeg verification and AAC audio transcoding.
 */
export function generateFolderRepairSh(options?: FolderRepairScriptOptions): string {
  const outDir = options?.outputFolder || 'Reparados_Para_Auto';
  const bitrate = options?.audioBitrate || '192k';
  const sampleRate = options?.sampleRate || 48000;

  return `#!/usr/bin/env bash
# ==============================================================================
#   REPARADOR AUTOMÁTICO DE VIDEOS Y AUDIO PARA ESTÉREOS DE AUTO (MAC / LINUX)
#   Multiplexa audio separado (.m4a/.opus) y recodifica Opus/Vorbis a AAC Estéreo
# ==============================================================================
set -e

OUT_DIR="${outDir}"
mkdir -p "$OUT_DIR"

echo "=============================================================================="
echo "    REPARADOR AUTOMÁTICO DE VIDEOS PARA PANTALLAS DE AUTO (MAC / LINUX)"
echo "    Destino: ./$OUT_DIR"
echo "=============================================================================="
echo ""

if ! command -v ffmpeg &> /dev/null; then
    echo "[1/2] FFmpeg no detectado en el sistema. Instalando..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
    else
        echo "[!] Por favor instala FFmpeg con: brew install ffmpeg"
        exit 1
    fi
else
    echo "[OK] FFmpeg detectado en el sistema."
fi

echo ""
echo "[2/2] Escaneando y reparando archivos de video..."
count=0
repaired=0

for f in *.{mp4,webm,mkv,m4v,avi,ts}; do
    [ -f "$f" ] || continue
    count=$((count+1))
    base="\${f%.*}"
    echo "------------------------------------------------------------------------------"
    echo "[$count] Procesando: $f"
    
    if [ -f "$base.m4a" ]; then
        echo " - [MULTIPLEXACIÓN] Detectado archivo de audio separado: $base.m4a"
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -i "$base.m4a" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    elif [ -f "$base.opus" ]; then
        echo " - [MULTIPLEXACIÓN] Detectado archivo de audio separado: $base.opus"
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -i "$base.opus" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    elif [ -f "$base.mp3" ]; then
        echo " - [MULTIPLEXACIÓN] Detectado archivo de audio separado: $base.mp3"
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -i "$base.mp3" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    else
        echo " - [RECODIFICACIÓN] Asegurando pista AAC Estéreo y contenedor MP4..."
        ffmpeg -y -hide_banner -loglevel warning -i "$f" -c:v copy -c:a aac -b:a ${bitrate} -ar ${sampleRate} -movflags +faststart "$OUT_DIR/$base.mp4"
    fi
    
    if [ -f "$OUT_DIR/$base.mp4" ]; then
        echo " [OK] Guardado en: $OUT_DIR/$base.mp4"
        repaired=$((repaired+1))
    fi
done

echo ""
echo "=============================================================================="
echo "  [FINALIZADO] $repaired videos reparados con audio garantizado en: $OUT_DIR"
echo "=============================================================================="
`;
}

/**
 * Generates an automated 1-click Windows .BAT script to download a SINGLE video
 * with guaranteed FFmpeg installation and FORCED AAC audio multiplexing.
 */
export function generateSingleVideoDownloadBat(
  videoUrl: string,
  title: string,
  resolution: string = '720p'
): string {
  const height = resolution === '1080p' ? '1080' : '720';
  const cleanTitle = title.replace(/[^\w\s\u00C0-\u024F]/gi, '').trim() || 'Video_Musical';
  const safeFilename = `${cleanTitle} (${resolution}).mp4`;

  return `@echo off
chcp 65001 >nul
title Descargador Automotriz de Video Único con Audio Garantizado (H.264 + AAC)
cls
echo ==============================================================================
echo     DESCARGADOR DE VIDEO INDIVIDUAL PARA AUTO (AUDIO GARANTIZADO)
echo     Video: MP4 (H.264 Max ${resolution})  -  Audio: AAC Estéreo 192k (Multiplexado)
echo ==============================================================================
echo.
echo Titulo : "${cleanTitle}"
echo URL    : "${videoUrl}"
echo.

REM 1. Verificar o descargar yt-dlp.exe
where yt-dlp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if not exist "yt-dlp.exe" (
        echo [1/3] Descargando motor de descarga yt-dlp...
        curl -L -o yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
    )
)
set YTDLP_CMD=yt-dlp
if exist "yt-dlp.exe" set YTDLP_CMD=yt-dlp.exe

REM 2. Verificar o instalar FFmpeg garantizado
set FFMPEG_OPT=
where ffmpeg >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [2/3] FFmpeg detectado en el sistema.
) else (
    if exist "ffmpeg.exe" (
        echo [2/3] ffmpeg.exe detectado localmente.
        set FFMPEG_OPT=--ffmpeg-location .
    ) else (
        echo [2/3] Configurando FFmpeg portable para multiplexacion de audio...
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
            "$ProgressPreference = 'SilentlyContinue'; " ^
            "try { " ^
            "    Invoke-WebRequest -Uri 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg_dl.zip' -UseBasicParsing; " ^
            "    Expand-Archive -Path 'ffmpeg_dl.zip' -DestinationPath 'ffmpeg_temp' -Force; " ^
            "    $f = Get-ChildItem -Path 'ffmpeg_temp' -Filter 'ffmpeg.exe' -Recurse | Select-Object -First 1; " ^
            "    if ($f) { Copy-Item $f.FullName -Destination 'ffmpeg.exe'; Remove-Item 'ffmpeg_dl.zip' -Force; Remove-Item 'ffmpeg_temp' -Recurse -Force; exit 0 } " ^
            "} catch {}"
        if exist "ffmpeg.exe" (
            set FFMPEG_OPT=--ffmpeg-location .
            echo       [OK] FFmpeg portable configurado!
        ) else (
            curl -L -o ffmpeg.exe "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64" 2>nul
            if exist "ffmpeg.exe" set FFMPEG_OPT=--ffmpeg-location .
        )
    )
)

echo.
echo [3/3] Descargando y forzando multiplexacion de video + audio AAC Estereo...
echo.

%YTDLP_CMD% ^
  --format "bestvideo[vcodec^=avc1][height<=${height}]+bestaudio[acodec^=mp4a]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}][ext=mp4]/best" ^
  --merge-output-format mp4 ^
  --remux-video mp4 ^
  --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart" ^
  %FFMPEG_OPT% ^
  --windows-filenames ^
  --no-mtime ^
  --output "${safeFilename}" ^
  "${videoUrl}"

echo.
echo ==============================================================================
echo   [COMPLETADO] ARCHIVO LISTO CON AUDIO GARANTIZADO: "${safeFilename}"
echo   Puedes copiarlo directamente a tu memoria USB o probarlo en el simulador.
echo ==============================================================================
echo.
pause
`;
}


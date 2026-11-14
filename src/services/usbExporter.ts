import JSZip from 'jszip';
import {
  CarVideoItem,
  UsbExportSettings,
  StereoCompatibilityReport,
} from '../types/media';

/**
 * Sanitizes file and directory names to strictly comply with FAT32, exFAT,
 * and automotive infotainment head unit character restrictions.
 */
export function sanitizeCarFilename(rawName: string): string {
  let cleaned = rawName.replace(/[\\/:*?"<>|]/g, '-');
  cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/-+/g, '-').trim();
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 120).trim();
  }
  return cleaned;
}

export function formatSafeVideoFilename(
  index: number,
  item: CarVideoItem,
  withPrefix = true,
  sanitize = true
): string {
  const prefix = withPrefix ? `${String(index + 1).padStart(2, '0')} - ` : '';
  const artist = sanitize ? sanitizeCarFilename(item.artist) : item.artist;
  const title = sanitize ? sanitizeCarFilename(item.title) : item.title;
  const resTag =
    item.resolution && item.resolution !== 'Sin verificar' ? ` (${item.resolution})` : '';
  return `${prefix}${artist} - ${title}${resTag}.mp4`;
}

export function getSortedGenres(items: CarVideoItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.genre))).sort((a, b) =>
    a.localeCompare(b, 'es')
  );
}

/**
 * Generates an automotive-standard M3U playlist file with #EXTM3U tags.
 */
export function generateM3uContent(
  playlistName: string,
  items: CarVideoItem[],
  settings: UsbExportSettings
): string {
  const lines: string[] = [
    '#EXTM3U',
    `#PLAYLIST:${playlistName}`,
    '#CREATED BY: CarVideo USB Studio',
    '',
  ];

  items.forEach((item, idx) => {
    const filename = formatSafeVideoFilename(
      idx,
      item,
      settings.addTrackNumberPrefix,
      settings.cleanFilenamesForStereos
    );
    const extDuration = item.durationSeconds > 0 ? item.durationSeconds : -1;
    lines.push(`#EXTINF:${extDuration},${item.artist} - ${item.title}`, filename, '');
  });

  return lines.join('\r\n');
}

export interface UsbFolderNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  sizeMb?: number;
  resolution?: string;
  children?: UsbFolderNode[];
}

/**
 * Builds a visual file tree reflecting the exact export settings.
 */
export function buildUsbVirtualTree(
  items: CarVideoItem[],
  settings: UsbExportSettings
): UsbFolderNode {
  const root: UsbFolderNode = {
    name: 'USB_AUTO (FAT32)',
    type: 'folder',
    path: '/',
    children: [],
  };

  if (settings.organizationMode === 'by-genre') {
    const genres = getSortedGenres(items);

    genres.forEach((genre) => {
      const genreItems = items.filter((i) => i.genre === genre);
      const folderName = sanitizeCarFilename(genre);
      const children: UsbFolderNode[] = [];

      if (settings.generateM3uPlaylists) {
        children.push({
          name: `${folderName}_Lista.m3u`,
          type: 'file',
          path: `/${folderName}/${folderName}_Lista.m3u`,
          sizeMb: 0.01,
        });
      }

      genreItems.forEach((item, idx) => {
        const filename = formatSafeVideoFilename(
          idx,
          item,
          settings.addTrackNumberPrefix,
          settings.cleanFilenamesForStereos
        );
        children.push({
          name: filename,
          type: 'file',
          path: `/${folderName}/${filename}`,
          sizeMb: item.fileSizeMb,
          resolution: item.resolution,
        });
      });

      root.children?.push({
        name: folderName,
        type: 'folder',
        path: `/${folderName}`,
        children,
      });
    });
  } else {
    if (settings.generateM3uPlaylists && items.length > 0) {
      root.children?.push({
        name: 'Lista_USB.m3u',
        type: 'file',
        path: '/Lista_USB.m3u',
        sizeMb: 0.01,
      });
    }

    items.forEach((item, idx) => {
      const filename = formatSafeVideoFilename(
        idx,
        item,
        settings.addTrackNumberPrefix,
        settings.cleanFilenamesForStereos
      );
      root.children?.push({
        name: filename,
        type: 'file',
        path: `/${filename}`,
        sizeMb: item.fileSizeMb,
        resolution: item.resolution,
      });
    });
  }

  root.children?.push({
    name: 'LEEME_INSTRUCCIONES_COCHE.txt',
    type: 'file',
    path: '/LEEME_INSTRUCCIONES_COCHE.txt',
    sizeMb: 0.01,
  });

  return root;
}

/**
 * Evaluates stereo and FAT32 compatibility for the current USB list.
 */
export function checkStereoCompatibility(
  items: CarVideoItem[]
): StereoCompatibilityReport {
  const warnings: string[] = [];
  const totalSizeMb = items.reduce((sum, item) => sum + item.fileSizeMb, 0);

  const oversizeItems = items.filter((i) => i.fileSizeMb > 4000);
  if (oversizeItems.length > 0) {
    warnings.push(
      `${oversizeItems.length} videos superan el límite de 4 GB por archivo del formato FAT32.`
    );
  }

  const fullHdCount = items.filter((i) => i.resolution === '1080p').length;
  if (fullHdCount > 0) {
    warnings.push(
      `${fullHdCount} videos están en 1080p Full HD (si notas tirones en radios antiguas, usa 720p).`
    );
  }

  const incompatibleAudio = items.filter(
    (i) =>
      i.audioCodec.toLowerCase().includes('sin audio') ||
      i.audioCodec.toLowerCase().includes('opus') ||
      i.audioCodec.toLowerCase().includes('vorbis')
  );
  if (incompatibleAudio.length > 0) {
    warnings.push(
      `${incompatibleAudio.length} videos tienen audio incompatible o mudo; usa "Reparar audio" antes de copiarlos al USB.`
    );
  }

  return {
    isFat32Safe: oversizeItems.length === 0,
    warnings,
    codecNotice: 'H.264 (AVC) compatible con la mayoría de pantallas automotrices.',
    audioSpec: 'AAC Estéreo 44.1/48 kHz.',
    totalSizeMb: Math.round(totalSizeMb * 10) / 10,
  };
}

/**
 * Triggers direct browser download for an individual MP4 video file.
 */
export function downloadSingleVideo(
  item: CarVideoItem,
  index = 0
): void {
  const streamUrl = item.videoStreamUrl;
  if (!streamUrl) return;

  const filename = formatSafeVideoFilename(index, item, false, true);
  const a = document.createElement('a');
  if (streamUrl.startsWith('blob:')) {
    a.href = streamUrl;
    a.download = filename;
  } else if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
    a.href = item.license?.sourceUrl || streamUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  } else {
    a.href = `/api/download/video?file=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(filename)}`;
    a.download = filename;
  }

  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function getPlayableVideoBlob(
  videoStreamUrl: string
): Promise<{ blob: Blob | null; reason?: string }> {
  if (!videoStreamUrl) {
    return { blob: null, reason: 'URL de video no disponible' };
  }

  try {
    const resp = await fetch(videoStreamUrl);
    if (!resp.ok) {
      return { blob: null, reason: `HTTP ${resp.status}` };
    }
    const contentType = resp.headers?.get?.('content-type')?.toLowerCase() || '';
    if (contentType.includes('text/html')) {
      return { blob: null, reason: 'Respuesta HTML inesperada en lugar de video MP4' };
    }
    const blob = await resp.blob();
    if (blob.size === 0) {
      return { blob: null, reason: 'Archivo vacío (0 bytes)' };
    }
    return { blob };
  } catch (err) {
    const reason = err instanceof Error && err.message ? err.message : 'Error de red o bloqueo CORS';
    return { blob: null, reason };
  }
}

export interface UsbZipFailedItem {
  title: string;
  filename: string;
  reason: string;
}

export interface UsbZipArchiveResult {
  blob: Blob;
  includedCount: number;
  failedItems: UsbZipFailedItem[];
}

function buildUsbInstructionsText(
  includedItems: CarVideoItem[],
  failedItems: UsbZipFailedItem[]
): string {
  const lines = [
    '===========================================================',
    'CARVIDEO USB STUDIO - GUIA PARA PANTALLAS DE VEHICULOS',
    '===========================================================',
    '',
    '1. Descomprime este archivo en la raiz de tu memoria USB (FAT32 o exFAT).',
    '2. Conecta la USB al puerto multimedia del vehiculo.',
    '3. Selecciona la fuente USB / Video en la pantalla del auto.',
    '',
    `CONTENIDO INCLUIDO (${includedItems.length}):`,
    ...includedItems.map(
      (i) =>
        ` - "${i.title}" (${i.artist}) · ${i.license.type} · ${i.license.attribution}`
    ),
  ];

  if (failedItems.length > 0) {
    lines.push(
      '',
      `VIDEOS NO INCLUIDOS POR ERROR DE DESCARGA (${failedItems.length}):`,
      'Estos videos no se pudieron descargar directamente en el ZIP (por bloqueo CORS o enlace caido). Descargalos manualmente o importalos desde tu PC:',
      ...failedItems.map((f) => ` - "${f.title}" (${f.filename}) · Motivo: ${f.reason}`)
    );
  }

  return lines.join('\r\n');
}

/**
 * Bundles the USB folder structure into a single ZIP archive without silent test.mp4 fallbacks.
 */
export async function createUsbZipArchive(
  items: CarVideoItem[],
  settings: UsbExportSettings,
  onProgress?: (progressPercent: number, currentAction: string) => void
): Promise<UsbZipArchiveResult> {
  const zip = new JSZip();
  onProgress?.(5, 'Preparando estructura de carpetas...');

  const includedItems: CarVideoItem[] = [];
  const failedItems: UsbZipFailedItem[] = [];
  let processedCount = 0;
  const total = Math.max(1, items.length);

  if (settings.organizationMode === 'by-genre') {
    const genres = getSortedGenres(items);

    for (const genre of genres) {
      const genreItems = items.filter((i) => i.genre === genre);
      const safeGenreFolder = sanitizeCarFilename(genre);
      const genreIncluded: CarVideoItem[] = [];
      let folder: JSZip | null = null;

      for (let idx = 0; idx < genreItems.length; idx++) {
        const item = genreItems[idx];
        const filename = formatSafeVideoFilename(
          idx,
          item,
          settings.addTrackNumberPrefix,
          settings.cleanFilenamesForStereos
        );

        onProgress?.(
          Math.round(10 + (processedCount / total) * 75),
          `Empaquetando: ${safeGenreFolder}/${filename}`
        );

        const { blob, reason } = await getPlayableVideoBlob(item.videoStreamUrl);
        if (blob) {
          folder ??= zip.folder(safeGenreFolder);
          folder?.file(filename, blob);
          genreIncluded.push(item);
          includedItems.push(item);
        } else {
          failedItems.push({
            title: item.title,
            filename: `${safeGenreFolder}/${filename}`,
            reason: reason || 'No disponible',
          });
        }
        processedCount++;
      }

      if (folder && settings.generateM3uPlaylists && genreIncluded.length > 0) {
        folder.file(
          `${safeGenreFolder}_Lista.m3u`,
          generateM3uContent(genre, genreIncluded, settings)
        );
      }
    }
  } else {
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const filename = formatSafeVideoFilename(
        idx,
        item,
        settings.addTrackNumberPrefix,
        settings.cleanFilenamesForStereos
      );

      onProgress?.(
        Math.round(10 + (processedCount / total) * 75),
        `Empaquetando: ${filename}`
      );

      const { blob, reason } = await getPlayableVideoBlob(item.videoStreamUrl);
      if (blob) {
        zip.file(filename, blob);
        includedItems.push(item);
      } else {
        failedItems.push({
          title: item.title,
          filename,
          reason: reason || 'No disponible',
        });
      }
      processedCount++;
    }

    if (settings.generateM3uPlaylists && includedItems.length > 0) {
      zip.file('Lista_USB.m3u', generateM3uContent('Lista USB Auto', includedItems, settings));
    }
  }

  if (items.length > 0 && includedItems.length === 0) {
    const firstReason = failedItems[0]?.reason || 'No disponible';
    throw new Error(
      `No se pudo descargar ninguno de los ${items.length} videos (${firstReason}). Usa la descarga individual de MP4 o impórtalos en local.`
    );
  }

  zip.file(
    'LEEME_INSTRUCCIONES_COCHE.txt',
    buildUsbInstructionsText(includedItems, failedItems)
  );

  onProgress?.(90, 'Generando archivo ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(
      Math.round(90 + metadata.percent / 10),
      `Comprimiendo: ${Math.round(metadata.percent)}%`
    );
  });

  onProgress?.(100, '¡Empaquetado completado!');
  return {
    blob: zipBlob,
    includedCount: includedItems.length,
    failedItems,
  };
}

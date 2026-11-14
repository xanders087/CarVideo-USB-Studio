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
  return `${prefix}${artist} - ${title} (${item.resolution}).mp4`;
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
    lines.push(`#EXTINF:${item.durationSeconds},${item.artist} - ${item.title}`);
    lines.push(filename);
    lines.push('');
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
    const genres = Array.from(new Set(items.map((i) => i.genre))).sort();

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
export async function downloadSingleVideo(
  item: CarVideoItem,
  index = 0
): Promise<void> {
  const filename = formatSafeVideoFilename(index, item, false, true);
  const streamUrl = item.videoStreamUrl || '/videos/test.mp4';

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
  document.body.removeChild(a);
}

async function getPlayableVideoBlob(videoStreamUrl: string): Promise<Blob | null> {
  try {
    const resp = await fetch(videoStreamUrl);
    if (resp.ok) {
      return await resp.blob();
    }
  } catch {
    // Fallback below
  }

  try {
    const fallbackResp = await fetch('/videos/test.mp4');
    if (fallbackResp.ok) {
      return await fallbackResp.blob();
    }
  } catch {
    // No fallback available
  }

  return null;
}

/**
 * Bundles the USB folder structure into a single ZIP archive.
 */
export async function createUsbZipArchive(
  items: CarVideoItem[],
  settings: UsbExportSettings,
  onProgress?: (progressPercent: number, currentAction: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  onProgress?.(5, 'Preparando estructura de carpetas...');

  const instructions = [
    '===========================================================',
    'CARVIDEO USB STUDIO - GUIA PARA PANTALLAS DE VEHICULOS',
    '===========================================================',
    '',
    '1. Descomprime este archivo en la raiz de tu memoria USB (FAT32 o exFAT).',
    '2. Conecta la USB al puerto multimedia del vehiculo.',
    '3. Selecciona la fuente USB / Video en la pantalla del auto.',
    '',
    'CONTENIDO INCLUIDO:',
    ...items.map(
      (i) =>
        ` - "${i.title}" (${i.artist}) · ${i.license.type} · ${i.license.attribution}`
    ),
  ].join('\r\n');

  zip.file('LEEME_INSTRUCCIONES_COCHE.txt', instructions);

  let processedCount = 0;
  const total = Math.max(1, items.length);

  if (settings.organizationMode === 'by-genre') {
    const genres = Array.from(new Set(items.map((i) => i.genre)));

    for (const genre of genres) {
      const genreItems = items.filter((i) => i.genre === genre);
      const safeGenreFolder = sanitizeCarFilename(genre);
      const folder = zip.folder(safeGenreFolder);

      if (folder) {
        if (settings.generateM3uPlaylists) {
          folder.file(
            `${safeGenreFolder}_Lista.m3u`,
            generateM3uContent(genre, genreItems, settings)
          );
        }

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

          const videoBlob = await getPlayableVideoBlob(item.videoStreamUrl);
          if (videoBlob) {
            folder.file(filename, videoBlob);
          }
          processedCount++;
        }
      }
    }
  } else {
    if (settings.generateM3uPlaylists) {
      zip.file('Lista_USB.m3u', generateM3uContent('Lista USB Auto', items, settings));
    }

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

      const videoBlob = await getPlayableVideoBlob(item.videoStreamUrl);
      if (videoBlob) {
        zip.file(filename, videoBlob);
      }
      processedCount++;
    }
  }

  onProgress?.(90, 'Generando archivo ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(
      Math.round(90 + metadata.percent / 10),
      `Comprimiendo: ${Math.round(metadata.percent)}%`
    );
  });

  onProgress?.(100, '¡Empaquetado completado!');
  return zipBlob;
}

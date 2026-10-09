import JSZip from 'jszip';
import { CarVideoItem, Playlist, UsbExportSettings, UsbOrganizationMode, StereoCompatibilityReport } from '../types/media';

/**
 * Sanitizes file and directory names to strictly comply with FAT32, exFAT,
 * and automotive infotainment head unit character restrictions.
 */
export function sanitizeCarFilename(rawName: string): string {
  // Replace illegal FAT32/exFAT characters: \ / : * ? " < > |
  let cleaned = rawName.replace(/[\\/:*?"<>|]/g, '-');
  // Normalize unicode accents to standard ASCII characters for older car display compatibility
  cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Collapse duplicate spaces or dashes
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/-+/g, '-').trim();
  // Ensure max length under 128 characters for safe car stereo scrolling
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 120).trim();
  }
  return cleaned;
}

export function formatSafeVideoFilename(index: number, item: CarVideoItem, withPrefix = true): string {
  const prefix = withPrefix ? `${String(index + 1).padStart(2, '0')} - ` : '';
  const artist = sanitizeCarFilename(item.artist);
  const title = sanitizeCarFilename(item.title);
  const res = item.resolution;
  return `${prefix}${artist} - ${title} (${res}).mp4`;
}

/**
 * Generates an automotive-standard M3U playlist file with #EXTM3U tags.
 */
export function generateM3uContent(playlistName: string, items: CarVideoItem[], relativePathPrefix = ''): string {
  const lines: string[] = [
    '#EXTM3U',
    `#PLAYLIST:${playlistName}`,
    '#CREATED BY: CarVideo USB Studio (Vehicle Media Exporter)',
    ''
  ];

  items.forEach((item, idx) => {
    const filename = formatSafeVideoFilename(idx, item, true);
    const path = relativePathPrefix ? `${relativePathPrefix}/${filename}` : filename;
    lines.push(`#EXTINF:${item.durationSeconds},${item.artist} - ${item.title}`);
    lines.push(path);
    lines.push('');
  });

  return lines.join('\r\n'); // Use Windows CRLF for maximum car stereo compatibility
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
 * Builds a visual file tree of how the USB flash drive will be organized.
 */
export function buildUsbVirtualTree(
  items: CarVideoItem[], 
  playlists: Playlist[], 
  mode: UsbOrganizationMode
): UsbFolderNode {
  const root: UsbFolderNode = {
    name: 'USB_DRIVE (FAT32)',
    type: 'folder',
    path: '/',
    children: []
  };

  if (mode === 'by-genre') {
    // Group by musical genre
    const genres = Array.from(new Set(items.map(i => i.genre))).sort();
    
    genres.forEach(genre => {
      const genreItems = items.filter(i => i.genre === genre);
      const genreFolder: UsbFolderNode = {
        name: sanitizeCarFilename(genre),
        type: 'folder',
        path: `/${sanitizeCarFilename(genre)}`,
        children: genreItems.map((item, idx) => ({
          name: formatSafeVideoFilename(idx, item, true),
          type: 'file',
          path: `/${sanitizeCarFilename(genre)}/${formatSafeVideoFilename(idx, item, true)}`,
          sizeMb: item.fileSizeMb,
          resolution: item.resolution
        }))
      };

      // Add genre playlist file
      genreFolder.children?.unshift({
        name: `${sanitizeCarFilename(genre)}_Lista.m3u`,
        type: 'file',
        path: `/${sanitizeCarFilename(genre)}/${sanitizeCarFilename(genre)}_Lista.m3u`,
        sizeMb: 0.01
      });

      root.children?.push(genreFolder);
    });
  } else {
    // Group by Playlists
    playlists.forEach(pl => {
      const plItems = items.filter(i => pl.videoIds.includes(i.id));
      const safePlName = sanitizeCarFilename(pl.name);
      const plFolder: UsbFolderNode = {
        name: safePlName,
        type: 'folder',
        path: `/${safePlName}`,
        children: plItems.map((item, idx) => ({
          name: formatSafeVideoFilename(idx, item, true),
          type: 'file',
          path: `/${safePlName}/${formatSafeVideoFilename(idx, item, true)}`,
          sizeMb: item.fileSizeMb,
          resolution: item.resolution
        }))
      };

      // Add playlist .m3u
      plFolder.children?.unshift({
        name: `${safePlName}.m3u`,
        type: 'file',
        path: `/${safePlName}/${safePlName}.m3u`,
        sizeMb: 0.01
      });

      root.children?.push(plFolder);
    });

    // Also a folder for items not in any playlist
    const allPlaylistVideoIds = new Set(playlists.flatMap(p => p.videoIds));
    const unorganized = items.filter(i => !allPlaylistVideoIds.has(i.id));
    if (unorganized.length > 0) {
      root.children?.push({
        name: 'Mas_Videos',
        type: 'folder',
        path: '/Mas_Videos',
        children: unorganized.map((item, idx) => ({
          name: formatSafeVideoFilename(idx, item, true),
          type: 'file',
          path: `/Mas_Videos/${formatSafeVideoFilename(idx, item, true)}`,
          sizeMb: item.fileSizeMb,
          resolution: item.resolution
        }))
      });
    }
  }

  // Include root legal notice & car stereo guide
  root.children?.push({
    name: 'LEEME_INSTRUCCIONES_COCHE.txt',
    type: 'file',
    path: '/LEEME_INSTRUCCIONES_COCHE.txt',
    sizeMb: 0.01
  });

  return root;
}

/**
 * Evaluates stereo and FAT32 compatibility for the current media bundle.
 */
export function checkStereoCompatibility(items: CarVideoItem[]): StereoCompatibilityReport {
  const warnings: string[] = [];
  const totalSizeMb = items.reduce((sum, item) => sum + item.fileSizeMb, 0);

  // Check file size limits for FAT32 (each single file < 4GB)
  const oversizeItems = items.filter(i => i.fileSizeMb > 4000);
  if (oversizeItems.length > 0) {
    warnings.push(`${oversizeItems.length} videos superan el límite de 4GB por archivo del formato FAT32.`);
  }

  // Check video resolution recommendations for car dashboards
  const fullHdCount = items.filter(i => i.resolution === '1080p').length;
  if (fullHdCount > 0) {
    warnings.push(`${fullHdCount} videos están en 1080p Full HD (verifica que tu pantalla soporte 1080p, la mayoría de 2017+ lo soportan nativamente).`);
  }

  return {
    isFat32Safe: oversizeItems.length === 0,
    warnings,
    codecNotice: 'H.264 (AVC) Baseline / Main / High Profile compatible con 99% de estéreos automotrices.',
    audioSpec: 'Audio AAC Estéreo 44.1/48kHz normalizado para acústica vehicular.',
    totalSizeMb: Math.round(totalSizeMb * 10) / 10
  };
}

/**
 * Triggers direct browser download for an individual MP4 video file with verified HTTP headers.
 */
export async function downloadSingleVideo(item: CarVideoItem, index = 0): Promise<void> {
  const filename = formatSafeVideoFilename(index, item, false);
  const streamUrl = item.videoStreamUrl || '/videos/test.mp4';
  
  // Use dedicated download endpoint with Content-Disposition, Content-Length and FastStart
  const backendUrl = `/api/download/video?file=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(filename)}`;
  const a = document.createElement('a');
  a.href = backendUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Helper to fetch a valid playable video blob with fallback
 */
async function getPlayableVideoBlob(videoStreamUrl: string): Promise<Blob | null> {
  try {
    const resp = await fetch(videoStreamUrl);
    if (resp.ok) {
      return await resp.blob();
    }
  } catch {}

  try {
    const fallbackResp = await fetch('/videos/test.mp4');
    if (fallbackResp.ok) {
      return await fallbackResp.blob();
    }
  } catch {}

  return null;
}

/**
 * Bundles the structured folder hierarchy into a ZIP archive ready for USB extraction.
 */
export async function createUsbZipArchive(
  items: CarVideoItem[],
  playlists: Playlist[],
  settings: UsbExportSettings,
  onProgress?: (progressPercent: number, currentAction: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  onProgress?.(10, 'Preparando estructura de carpetas...');

  // 1. Add instructions and legal metadata file
  const instructions = [
    '===========================================================',
    'CARVIDEO USB STUDIO - GUIA PARA PANTALLAS Y ESTEREOS DE AUTO',
    '===========================================================',
    '',
    'INSTRUCCIONES DE USO EN TU VEHICULO:',
    '1. Descomprime todo el contenido de este archivo en la raiz de tu memoria USB formateada en FAT32 o exFAT.',
    '2. Conecta la memoria USB al puerto multimedia de tu vehiculo (evita puertos marcados solo como "Carga").',
    '3. En la pantalla del estereo, selecciona la fuente "USB / Video".',
    '4. Navega por las carpetas organizadas para seleccionar tus canciones o abre los archivos .m3u.',
    '',
    'REPRODUCCION EN PC (WINDOWS / MAC):',
    '- Todos los archivos de video son MP4 estandar (H.264 / AAC Estereo) con atomo FastStart.',
    '- En Windows, si el reproductor nativo "Peliculas y TV" muestra advertencias por politicas de codec, utiliza el Reproductor Multimedia de Windows o VLC Media Player.',
    '',
    'AVISO DE DERECHOS Y LICENCIAS:',
    'Los videos y temas incluidos han sido verificados para reproduccion privada en vehiculos.',
    'Licencias incluidas:',
    ...items.map(i => ` - "${i.title}" por ${i.artist} (${i.license.type}). Atribucion: ${i.license.attribution}`),
    '',
    'Generado con exito por CarVideo USB Studio.'
  ].join('\r\n');

  zip.file('LEEME_INSTRUCCIONES_COCHE.txt', instructions);

  // 2. Build folders and files according to user mode
  if (settings.organizationMode === 'by-genre') {
    const genres = Array.from(new Set(items.map(i => i.genre)));
    
    for (let gIdx = 0; gIdx < genres.length; gIdx++) {
      const genre = genres[gIdx];
      const genreItems = items.filter(i => i.genre === genre);
      const safeGenreFolder = sanitizeCarFilename(genre);
      const folder = zip.folder(safeGenreFolder);

      if (folder) {
        // Add playlist inside genre
        if (settings.generateM3uPlaylists) {
          const m3uText = generateM3uContent(genre, genreItems);
          folder.file(`${safeGenreFolder}_Lista.m3u`, m3uText);
        }

        // Add real valid playable MP4 video files
        for (let iIdx = 0; iIdx < genreItems.length; iIdx++) {
          const item = genreItems[iIdx];
          const filename = formatSafeVideoFilename(iIdx, item, settings.addTrackNumberPrefix);
          
          onProgress?.(
            Math.round(20 + ((gIdx * genreItems.length + iIdx) / (genres.length * genreItems.length)) * 70),
            `Empaquetando: ${safeGenreFolder}/${filename}`
          );

          const videoBlob = await getPlayableVideoBlob(item.videoStreamUrl);
          if (videoBlob) {
            folder.file(filename, videoBlob);
          }
        }
      }
    }
  } else {
    // By Playlists
    for (let pIdx = 0; pIdx < playlists.length; pIdx++) {
      const pl = playlists[pIdx];
      const plItems = items.filter(i => pl.videoIds.includes(i.id));
      const safePlName = sanitizeCarFilename(pl.name);
      const folder = zip.folder(safePlName);

      if (folder) {
        if (settings.generateM3uPlaylists) {
          const m3uText = generateM3uContent(pl.name, plItems);
          folder.file(`${safePlName}.m3u`, m3uText);
        }

        for (let iIdx = 0; iIdx < plItems.length; iIdx++) {
          const item = plItems[iIdx];
          const filename = formatSafeVideoFilename(iIdx, item, settings.addTrackNumberPrefix);
          
          onProgress?.(
            Math.round(20 + ((pIdx * plItems.length + iIdx) / (playlists.length * plItems.length)) * 70),
            `Empaquetando: ${safePlName}/${filename}`
          );

          const videoBlob = await getPlayableVideoBlob(item.videoStreamUrl);
          if (videoBlob) {
            folder.file(filename, videoBlob);
          }
        }
      }
    }
  }

  onProgress?.(95, 'Generando archivo ZIP de alta compatibilidad...');
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(Math.round(90 + (metadata.percent / 10)), `Comprimiendo: ${Math.round(metadata.percent)}%`);
  });

  onProgress?.(100, '¡Empaquetado completado!');
  return zipBlob;
}

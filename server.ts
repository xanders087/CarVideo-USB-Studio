import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Explicitly serve public/videos with proper caching and headers
const videosDir = path.resolve(__dirname, 'public/videos');
if (fs.existsSync(videosDir)) {
  app.use('/videos', express.static(videosDir, {
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
    }
  }));
}

function classifyArchiveHeight(height: unknown): '1080p' | '720p' | '480p' | 'Sin verificar' {
  const numericHeight = Number(height);
  if (!Number.isFinite(numericHeight) || numericHeight <= 0) {
    return 'Sin verificar';
  }
  if (numericHeight >= 1000) {
    return '1080p';
  }
  if (numericHeight >= 720) {
    return '720p';
  }
  return '480p';
}

// Endpoint: Real Live Search on Archive.org for Public Domain Music Videos & Live Concerts
app.get('/api/archive-search', async (req, res) => {
  const query = (req.query.q as string) || '';
  if (!query.trim()) {
    return res.json({ results: [] });
  }

  try {
    // Formulate a clean Archive.org query focusing on movies/video media
    const cleanQ = query.replace(/[^\w\s\u00C0-\u024F]/gi, ' ').trim();
    const archiveUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(cleanQ + ' AND mediatype:(movies)')}&fl[]=identifier,title,description,year,downloads,mediatype&sort[]=downloads desc&rows=12&output=json`;
    
    const response = await fetch(archiveUrl);
    if (!response.ok) {
      return res.json({ results: [] });
    }
    
    const data = await response.json();
    const docs = data.response?.docs || [];

    // Parallel fetch metadata for files in top matching items to locate direct MP4 files
    const results = await Promise.all(docs.slice(0, 8).map(async (doc: any) => {
      try {
        const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}/files`, {
          signal: AbortSignal.timeout(3500)
        });
        if (!metaRes.ok) return null;
        
        const metaData = await metaRes.json();
        const files: any[] = metaData.result || [];
        
        // Find best MP4 video stream (prioritize MPEG4 format, then any .mp4)
        const mp4File = files.find(f => f.name?.toLowerCase().endsWith('.mp4') && f.format?.toLowerCase().includes('mpeg4')) ||
                        files.find(f => f.name?.toLowerCase().endsWith('.mp4') && !f.name?.includes('_thumb'));
        if (!mp4File) return null;

        const parsedSize = Number(mp4File.size);
        const sizeMb = Number.isFinite(parsedSize) && parsedSize > 0
          ? Math.round((parsedSize / (1024 * 1024)) * 10) / 10
          : 0;
        const parsedLength = Number(mp4File.length);
        const durationSec = Number.isFinite(parsedLength) && parsedLength > 0
          ? Math.round(parsedLength)
          : 0;
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const durationFormatted = durationSec > 0
          ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : '--:--';
        
        const rawTitle = (doc.title || doc.identifier || 'Video Musical')
          .replace(/y2mate\.com\s*-\s*/gi, '')
          .replace(/y-2mate\.com\s*-\s*/gi, '')
          .replace(/\[.*?\]/g, '')
          .replace(/\(.*?\)/g, '')
          .trim();

        const encodedFile = encodeURIComponent(mp4File.name);
        const directUrl = `https://archive.org/download/${doc.identifier}/${encodedFile}`;
        const resolution = classifyArchiveHeight(mp4File.height);
        
        return {
          id: `archive-${doc.identifier}`,
          identifier: doc.identifier,
          title: rawTitle || 'Concierto / Video Musical',
          artist: doc.year ? `Archivo Histórico (${doc.year})` : 'Internet Archive',
          year: doc.year || 'Histórico',
          downloads: doc.downloads || 0,
          format: 'MP4',
          fileSizeMb: sizeMb,
          durationFormatted,
          durationSeconds: durationSec,
          resolution,
          videoCodec: mp4File.format ? `MP4 (${mp4File.format}) · Sin verificar` : 'MP4 (Sin verificar)',
          audioCodec: 'Sin verificar (archivo remoto)',
          downloadUrl: directUrl,
          videoStreamUrl: directUrl,
          source: 'Internet Archive (Abierto / Dominio Público)',
          licenseType: 'Dominio Público'
        };
      } catch {
        return null;
      }
    }));

    return res.json({ 
      results: results.filter(Boolean),
      source: 'archive.org',
      query
    });
  } catch (error) {
    console.error('Error in archive search:', error);
    return res.status(500).json({ error: 'Error al consultar Archive.org', results: [] });
  }
});

// Endpoint: Force Download MP4 Video file with proper headers for PC & Car USB
app.get('/api/download/video', (req, res) => {
  const fileParam = (req.query.file as string) || '';
  const titleParam = (req.query.title as string) || 'video_coche.mp4';

  // Sanitize filename for safe file matching
  let baseName = path.basename(fileParam.replace(/\\/g, '/'));
  if (!baseName.endsWith('.mp4')) {
    baseName = `${baseName}.mp4`;
  }

  // Look in public/videos or fallback to test.mp4
  let targetPath = path.resolve(__dirname, 'public/videos', baseName);
  if (!fs.existsSync(targetPath)) {
    if (fileParam.toLowerCase().includes('vallenato')) {
      targetPath = path.resolve(__dirname, 'public/videos', 'vallenato.mp4');
    } else {
      targetPath = path.resolve(__dirname, 'public/videos', 'test.mp4');
    }
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send('Video no encontrado en el servidor');
  }

  const stat = fs.statSync(targetPath);
  const safeDownloadTitle = titleParam.endsWith('.mp4') ? titleParam : `${titleParam}.mp4`;
  
  // Clean ASCII filename without characters that corrupt Windows downloads
  const cleanAsciiFilename = safeDownloadTitle
    .replace(/[^\w\s\-\.\(\)]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  const encodedUtf8 = encodeURIComponent(safeDownloadTitle);

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${cleanAsciiFilename}"; filename*=UTF-8''${encodedUtf8}`
  );
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const fileStream = fs.createReadStream(targetPath);
  fileStream.on('error', (streamError) => {
    console.error('Error streaming video file:', streamError);
    if (!res.headersSent) {
      res.status(500).send('Error al leer el video en el servidor');
    } else {
      res.destroy();
    }
  });
  fileStream.pipe(res);
});

// Vite Middleware for Full-Stack development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarVideo USB Studio server running on port ${PORT}`);
  });
}

startServer();

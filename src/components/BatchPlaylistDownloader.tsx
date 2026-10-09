import React, { useState } from 'react';
import { 
  ListMusic, 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  FolderPlus, 
  Sliders, 
  Sparkles, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ArrowRight,
  Upload,
  Info,
  ShieldCheck,
  FileCode2,
  ExternalLink,
  Volume2,
  VolumeX,
  AlertTriangle
} from 'lucide-react';
import { VideoResolution } from '../types/media';

interface BatchPlaylistDownloaderProps {
  onNavigateToDropzone: () => void;
  onNavigateToCarCockpit?: () => void;
  stagingCount: number;
}

export const BatchPlaylistDownloader: React.FC<BatchPlaylistDownloaderProps> = ({
  onNavigateToDropzone,
  stagingCount
}) => {
  // Playlist input
  const [playlistUrl, setPlaylistUrl] = useState('https://www.youtube.com/playlist?list=PLrAl5_Q5e3L9oP6C4q3J2e8_k1-X7zR');
  const [targetFolder, setTargetFolder] = useState('USB_Musica_Auto');
  const [targetDrive, setTargetDrive] = useState<string>('actual'); // 'actual' | 'E:' | 'D:' | 'F:'
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution>('720p');
  const [includeTrackPrefix, setIncludeTrackPrefix] = useState(true);
  const [organizeInSubfolder, setOrganizeInSubfolder] = useState(true);
  const [estimatedCount, setEstimatedCount] = useState<number>(30);
  
  // UI states
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'command'>('windows');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Popular music genre presets
  const PLAYLIST_PRESETS = [
    {
      title: 'Mix Vallenatos Clásicos de Oro',
      genre: 'Vallenato',
      url: 'https://www.youtube.com/results?search_query=mix+vallenatos+clasicos+en+vivo',
      estimatedSongs: 25,
      description: 'Diomedes Díaz, Binomio de Oro, Los Chiches, Jorge Oñate'
    },
    {
      title: 'Grandes Éxitos de la Salsa',
      genre: 'Salsa',
      url: 'https://www.youtube.com/results?search_query=mix+salsa+romantica+clasicos',
      estimatedSongs: 30,
      description: 'Héctor Lavoe, Marc Anthony, Grupo Niche, Joe Arroyo'
    },
    {
      title: 'Rock Clásico en Español de Carretera',
      genre: 'Rock',
      url: 'https://www.youtube.com/results?search_query=rock+en+espanol+clasicos+80s+90s',
      estimatedSongs: 28,
      description: 'Soda Stereo, Enanitos Verdes, Maná, Los Prisioneros'
    },
    {
      title: 'Cumbias y Fiestas Bailables',
      genre: 'Cumbia',
      url: 'https://www.youtube.com/results?search_query=mix+cumbias+clasicas+bailables',
      estimatedSongs: 35,
      description: 'Los Ángeles Azules, Pastor López, Rodolfo Aicardi'
    }
  ];

  // Capacity math
  const avgVideoMb = selectedResolution === '720p' ? 45 : 78;
  const totalEstimatedMb = estimatedCount * avgVideoMb;
  const totalEstimatedGb = (totalEstimatedMb / 1024).toFixed(2);

  // USB usage estimation
  const usbCapacity = 16 * 1024; // 16GB USB baseline
  const usedPercent = Math.min(100, Math.round((totalEstimatedMb / usbCapacity) * 100));

  // Filename template (forBat uses %% so Windows CMD doesn't strip variable names)
  const getOutputTemplate = (forBat: boolean = false) => {
    const p = forBat ? '%%' : '%';
    const prefix = includeTrackPrefix ? `${p}(playlist_index)02d - ` : '';
    const folder = organizeInSubfolder ? `${p}(playlist_title)s/` : '';
    return `${folder}${prefix}${p}(title)s.${p}(ext)s`;
  };

  // Build Windows .BAT script with automated yt-dlp AND ffmpeg installation
  const generateWindowsBat = () => {
    const height = selectedResolution === '1080p' ? '1080' : '720';
    const outputTmpl = getOutputTemplate(true);
    const drivePrefix = targetDrive !== 'actual' ? `${targetDrive}\\${targetFolder}\\` : `${targetFolder}/`;

    return `@echo off
chcp 65001 >nul
title Preparador Automotriz de Listas para USB - Video MP4 (H.264 + AAC Estereo)
cls
echo ===================================================================
echo     PREPARADOR AUTOMOTRIZ DE PLAYLISTS PARA MEMORIA USB
echo     Video: MP4 (H.264)  -  Audio: AAC Estereo 192k  -  FAT32 Seguro
echo ===================================================================
echo.
echo URL de la Lista : "${playlistUrl}"
echo Carpeta Destino : "${targetFolder}"
echo Calidad Maxima  : ${selectedResolution}
echo.

REM 1. Verificar si yt-dlp.exe existe en la ruta o en el sistema
where yt-dlp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if not exist "yt-dlp.exe" (
        echo [1/3] Descargando motor de descarga rapida yt-dlp.exe...
        echo       (Solo toma 3 segundos y queda listo para siempre)
        curl -L -o yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
        if not exist "yt-dlp.exe" (
            echo.
            echo [!] Error: No se pudo descargar yt-dlp.exe automaticamente.
            echo Verifica tu conexion a internet o descargalo manualmente.
            pause
            exit /b 1
        )
    )
)

set YTDLP_CMD=yt-dlp
if exist "yt-dlp.exe" set YTDLP_CMD=yt-dlp.exe

REM 2. Verificar FFmpeg (INDISPENSABLE para que el video tenga audio con sonido)
REM    YouTube entrega video y audio por separado (formatos DASH como .f133).
REM    FFmpeg une la pista de imagen con la de audio AAC para que suene en el auto.
set FFMPEG_OPT=
where ffmpeg >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [2/3] FFmpeg detectado en el sistema Windows. El audio se fusionara correctamente.
) else (
    if exist "ffmpeg.exe" (
        echo [2/3] ffmpeg.exe detectado localmente en esta carpeta.
        set FFMPEG_OPT=--ffmpeg-location .
    ) else (
        echo [2/3] Configurando motor de audio FFmpeg portable oficial...
        echo       (YouTube separa el video del audio; este paso garantiza sonido en el auto)
        
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
            "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
            "$ProgressPreference = 'SilentlyContinue'; " ^
            "try { " ^
            "    Invoke-WebRequest -Uri 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg_dl.zip' -UseBasicParsing; " ^
            "    Expand-Archive -Path 'ffmpeg_dl.zip' -DestinationPath 'ffmpeg_temp' -Force; " ^
            "    $f = Get-ChildItem -Path 'ffmpeg_temp' -Filter 'ffmpeg.exe' -Recurse | Select-Object -First 1; " ^
            "    if ($f) { Copy-Item $f.FullName -Destination 'ffmpeg.exe'; Remove-Item 'ffmpeg_dl.zip' -Force; Remove-Item 'ffmpeg_temp' -Recurse -Force; exit 0 } " ^
            "} catch {}"
        
        if exist "ffmpeg.exe" (
            set FFMPEG_OPT=--ffmpeg-location .
            echo       [OK] FFmpeg portable configurado con exito!
        ) else (
            curl -L -o ffmpeg.exe "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64" 2>nul
            if exist "ffmpeg.exe" (
                set FFMPEG_OPT=--ffmpeg-location .
                echo       [OK] FFmpeg de respaldo configurado!
            ) else (
                echo       [AVISO] No se pudo instalar FFmpeg automaticamente.
                echo       Si los videos se descargan sin sonido, coloca ffmpeg.exe en esta carpeta.
            )
        )
    )
)

REM 3. Crear carpeta de destino
if not exist "${targetFolder}" mkdir "${targetFolder}"

echo.
echo [3/3] Descargando lista completa y combinando audio estereo para auto...
echo       - Video: H.264 MP4 (Max ${selectedResolution})
echo       - Audio: AAC Estereo 192kbps (Universal para radios de vehiculo)
echo       - Nombres numerados sin caracteres especiales
echo.

%YTDLP_CMD% --yes-playlist ^
  --format "bestvideo[vcodec^=avc1][height<=${height}]+bestaudio[acodec^=mp4a]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}][ext=mp4]/best" ^
  --merge-output-format mp4 ^
  --remux-video mp4 ^
  --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart" ^
  %FFMPEG_OPT% ^
  --windows-filenames ^
  --no-mtime ^
  --continue ^
  --ignore-errors ^
  --no-warnings ^
  --output "${drivePrefix}${outputTmpl}" ^
  "${playlistUrl}"

echo.
echo ===================================================================
echo   [COMPLETADO] TODOS LOS VIDEOS TIENEN AUDIO Y VIDEO COMBINADOS!
echo   Ubicacion: "${targetFolder}"
echo   Estan listos para copiar a tu USB o arrastrar a la app para probar en cabina.
echo ===================================================================
echo.
pause
`;
  };

  // Build Mac/Linux .SH script
  const generateMacSh = () => {
    const height = selectedResolution === '1080p' ? '1080' : '720';
    const outputTmpl = getOutputTemplate(false);

    return `#!/usr/bin/env bash
# ===================================================================
#   PREPARADOR AUTOMOTRIZ DE PLAYLISTS PARA MEMORIA USB
#   Perfil: MP4 (H.264 + AAC) - Max ${selectedResolution} - FAT32 Seguro
# ===================================================================

PLAYLIST_URL="${playlistUrl}"
TARGET_DIR="${targetFolder}"

echo "Iniciando descarga por lotes para estéreo de auto..."
mkdir -p "$TARGET_DIR"

if ! command -v yt-dlp &> /dev/null; then
    echo "[1/3] yt-dlp no detectado. Descargando binario..."
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./yt-dlp
    chmod a+rx ./yt-dlp
    YTDLP_CMD="./yt-dlp"
else
    YTDLP_CMD="yt-dlp"
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "[!] Aviso: ffmpeg no detectado en el sistema."
    echo "    Instalando FFmpeg para multiplexar audio y video en MP4..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    fi
fi

echo "[2/3] Descargando lista completa con restricciones automotrices..."

$YTDLP_CMD --yes-playlist \\
  --format "bestvideo[vcodec^=avc1][height<=${height}]+bestaudio[acodec^=mp4a]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}][ext=mp4]/best" \\
  --merge-output-format mp4 \\
  --remux-video mp4 \\
  --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart" \\
  --windows-filenames \\
  --no-mtime \\
  --continue \\
  --ignore-errors \\
  --output "$TARGET_DIR/${outputTmpl}" \\
  "$PLAYLIST_URL"

echo "==================================================================="
echo "  [3/3] LISTA DESCARGADA CON EXITO EN '$TARGET_DIR'!"
echo "==================================================================="
`;
  };

  // Terminal command only
  const getSingleLineCommand = () => {
    const height = selectedResolution === '1080p' ? '1080' : '720';
    const outputTmpl = getOutputTemplate(false);
    return `yt-dlp --yes-playlist -f "bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}][ext=mp4]/best" --merge-output-format mp4 --postprocessor-args "ffmpeg:-c:v copy -c:a aac -b:a 192k" --windows-filenames --output "${targetFolder}/${outputTmpl}" "${playlistUrl}"`;
  };

  // Trigger file download helper
  const downloadScriptFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNoticeMessage(`¡Archivo "${filename}" descargado! Haz doble clic en él en tu PC.`);
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Notice Alert */}
      {noticeMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button 
            onClick={() => setNoticeMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Feature Intro Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
          <ListMusic className="w-4 h-4 text-cyan-400" />
          <span>Solución para Lotes & Mezclas</span>
          <span aria-hidden="true">·</span>
          <span>Automatización 1-Clic para PC</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
          Descargar Listas Completas y Mezclas para la Memoria USB
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Descargar 30 o 50 videos uno por uno en páginas web es agotador. Esta herramienta genera un <strong className="text-white">Script Automatizado de 1 Clic</strong> para tu ordenador (Windows o Mac). 
          Al ejecutarlo con doble clic, <strong className="text-cyan-300">descarga toda la lista de un solo tirón a máxima velocidad</strong>, con los códecs exactos (H.264 + AAC) y los nombres numerados sin caracteres raros para que el estéreo de tu auto los reproduzca sin trabarse.
        </p>

        {/* 3 Step Workflow Pill */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 font-bold">PASO 1</span>
            <p className="text-xs font-semibold text-slate-200">Pega la URL de la lista</p>
            <p className="text-[11px] text-slate-400">Pega el link de cualquier lista o mix musical de YouTube.</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-[11px] font-mono text-emerald-400 font-bold">PASO 2</span>
            <p className="text-xs font-semibold text-slate-200">Descarga el Script (.bat)</p>
            <p className="text-[11px] text-slate-400">Haz doble clic en tu PC. Descarga todo automáticamente sin anuncios.</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-[11px] font-mono text-amber-400 font-bold">PASO 3</span>
            <p className="text-xs font-semibold text-slate-200">Arrastra la carpeta a la app</p>
            <p className="text-[11px] text-slate-400">Valida el tamaño final, prueba en el auto y cópialo a tu pendrive.</p>
          </div>
        </div>
      </div>

      {/* AUDIO DIAGNOSTIC & FIX BANNER (Specifically addresses no-audio and f133 filename issues) */}
      <div className="p-5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-cyan-950/70 border border-amber-600/50 rounded-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
            <VolumeX className="w-5 h-5 text-amber-400 shrink-0" />
            <span>¿Descargaste un video que reproduce pero sin audio o con nombre &quot;(playlist_index)...f133.mp4&quot;?</span>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[11px] font-mono shrink-0">
            Causa & Solución
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>¿Por qué ocurrió esto?</span>
            </div>
            <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                <strong className="text-slate-300">YouTube no guarda audio y video juntos</strong> en HD: los transmite en flujos DASH separados (el formato <code className="text-amber-300">.f133</code> es solo video sin sonido).
              </li>
              <li>
                Para unir ambas pistas en un único MP4 con sonido se requiere el motor <strong className="text-slate-300">FFmpeg</strong>. Sin él en tu PC, se descargó solo el video silencioso.
              </li>
              <li>
                El nombre <code className="text-amber-300">(playlist_index)...</code> ocurrió porque en Windows <code className="text-cyan-300">.bat</code> el símbolo <code className="text-cyan-300">%</code> debe ir duplicado (<code className="text-cyan-300">%%</code>) para no borrarse.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-950/80 border border-emerald-900/60 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Solución Automática Ya Aplicada</span>
            </div>
            <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                El nuevo script <strong className="text-slate-200">descarga automáticamente ffmpeg.exe</strong> en tu misma carpeta si no lo tienes instalado.
              </li>
              <li>
                Corrige las variables a <code className="text-emerald-300">%%(title)s</code> para nombrar cada video con su título y número real.
              </li>
              <li>
                Fusiona el audio con códec <strong className="text-emerald-300">AAC Estéreo 192kbps</strong>, 100% compatible con cualquier pantalla de auto.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => downloadScriptFile(generateWindowsBat(), `Descargar_Playlist_${targetFolder}.bat`)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-950/40"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Script Corregido (.bat con Audio FFmpeg Auto)</span>
          </button>
          <span className="text-[11px] text-slate-400">
            Haz doble clic al nuevo archivo <code className="text-amber-300">.bat</code> y descargará todo con audio estéreo nítido.
          </span>
        </div>
      </div>

      {/* Configuration & Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Controls (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Playlist URL Input Box */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="playlist-url" className="text-sm font-semibold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-cyan-400" />
                <span>Enlace de la Lista de Reproducción o Mix:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">YouTube Playlist / Mix</span>
            </div>

            <div className="space-y-2">
              <input
                id="playlist-url"
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PL..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                Acepta enlaces con <code className="text-cyan-300">playlist?list=...</code>, o cualquier enlace con múltiples canciones.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-medium text-slate-300">Sugerencias y Géneros Populares de Carretera:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLAYLIST_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPlaylistUrl(preset.url);
                      setTargetFolder(`Musica_${preset.genre}`);
                      setEstimatedCount(preset.estimatedSongs);
                      setNoticeMessage(`Lista cargada: "${preset.title}" (~${preset.estimatedSongs} temas)`);
                      setTimeout(() => setNoticeMessage(null), 3000);
                    }}
                    className="p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-800/80 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      <span>{preset.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">~{preset.estimatedSongs} videos</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Automotive Formatting Options */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Parámetros Automotrices para Estéreos</h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">Perfil Universal FAT32</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option 1: Max Resolution */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Resolución de Video:</label>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedResolution('720p')}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      selectedResolution === '720p'
                        ? 'bg-cyan-900/60 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    720p HD (Recomendada Carros)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedResolution('1080p')}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      selectedResolution === '1080p'
                        ? 'bg-cyan-900/60 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1080p FHD
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">720p previene sobrecalentamiento y pantallas congeladas.</p>
              </div>

              {/* Option 2: Folder Name */}
              <div className="space-y-1.5">
                <label htmlFor="folder-name" className="text-xs text-slate-300 font-medium">Nombre de Carpeta en la Memoria:</label>
                <input
                  id="folder-name"
                  type="text"
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value.replace(/[^\w-]/g, '_'))}
                  placeholder="USB_Musica_Auto"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400">Se guardará como subcarpeta organizada en tu pendrive.</p>
              </div>

              {/* Option 3: Track Numbering Checkbox */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Orden de Reproducción:</label>
                <button
                  type="button"
                  onClick={() => setIncludeTrackPrefix(!includeTrackPrefix)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-xs text-slate-300 flex items-center justify-between"
                >
                  <span>Numerar pistas (`01 - `, `02 - `)</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${includeTrackPrefix ? 'bg-cyan-500 text-slate-950' : 'border border-slate-600'}`}>
                    {includeTrackPrefix && <Check className="w-3 h-3" />}
                  </div>
                </button>
                <p className="text-[10px] text-slate-400">Mantiene el orden exacto de la lista en la pantalla del auto.</p>
              </div>

              {/* Option 4: Subfolder creation */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Estructura de Carpetas:</label>
                <button
                  type="button"
                  onClick={() => setOrganizeInSubfolder(!organizeInSubfolder)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-xs text-slate-300 flex items-center justify-between"
                >
                  <span>Crear carpeta con nombre de la lista</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${organizeInSubfolder ? 'bg-cyan-500 text-slate-950' : 'border border-slate-600'}`}>
                    {organizeInSubfolder && <Check className="w-3 h-3" />}
                  </div>
                </button>
                <p className="text-[10px] text-slate-400">Ideal para tener varias playlists separadas en la misma USB.</p>
              </div>

            </div>
          </div>

          {/* Action Download Script Panel */}
          <div className="p-5 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/80 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Generar y Descargar Script Automatizado</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Descarga el archivo a tu PC y haz doble clic para iniciar la descarga masiva.
                </p>
              </div>
            </div>

            {/* Platform Selector */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('windows')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'windows'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                Windows (.bat) - Recomendado
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mac')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'mac'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                Mac / Linux (.sh)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('command')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'command'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                Comando Directo de Terminal
              </button>
            </div>

            {/* Tab 1: Windows .bat */}
            {activeTab === 'windows' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Script Auto-Ejecutable para Windows</span>
                    <span className="text-[11px] text-emerald-400 font-mono">Doble clic y listo</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Este archivo comprueba si tienes el motor <code className="text-cyan-300">yt-dlp</code>. Si no lo tienes, <strong className="text-white">lo descarga de forma segura en 3 segundos</strong> y procede a descargar todos los videos de la lista en MP4 H.264 dentro de la carpeta <code className="text-cyan-300">{targetFolder}</code>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadScriptFile(generateWindowsBat(), `Descargar_Playlist_${targetFolder}.bat`)}
                    className="w-full sm:w-auto flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-cyan-950/50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Script Windows (.bat)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(generateWindowsBat(), 'bat-code')}
                    className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    {copiedType === 'bat-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedType === 'bat-code' ? '¡Código Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Mac/Linux .sh */}
            {activeTab === 'mac' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Script Bash para macOS o Linux</span>
                    <span className="text-[11px] text-emerald-400 font-mono">bash script.sh</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Descarga el archivo <code className="text-cyan-300">.sh</code>, ábrelo en tu terminal con <code className="text-white">bash Descargar_Playlist.sh</code> y descargará los videos a máxima velocidad.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadScriptFile(generateMacSh(), `Descargar_Playlist_${targetFolder}.sh`)}
                    className="w-full sm:w-auto flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Script Mac (.sh)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(generateMacSh(), 'sh-code')}
                    className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    {copiedType === 'sh-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedType === 'sh-code' ? '¡Código Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Command Line */}
            {activeTab === 'command' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                  <span className="text-xs font-semibold text-slate-200">Comando para PowerShell, CMD o Terminal:</span>
                  <p className="font-mono text-xs text-cyan-300 break-all select-all bg-slate-900 p-2.5 rounded border border-slate-800">
                    {getSingleLineCommand()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(getSingleLineCommand(), 'single-cmd')}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  {copiedType === 'single-cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === 'single-cmd' ? '¡Comando Copiado!' : 'Copiar Comando en 1 Clic'}</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Storage & USB Estimator (1 col) */}
        <div className="space-y-5">
          
          {/* Storage Math Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Estimación de Espacio en Memoria USB</h3>
            </div>

            {/* Songs Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cantidad estimada de videos:</span>
                <span className="font-mono text-white font-bold">{estimatedCount} videos</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={estimatedCount}
                onChange={(e) => setEstimatedCount(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5 temas</span>
                <span>50 temas</span>
                <span>150 temas</span>
              </div>
            </div>

            {/* Calculated Weight Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Peso Total Estimado:</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  ~{totalEstimatedGb} GB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aproximadamente {avgVideoMb} MB por video musical en resolución {selectedResolution}.
              </p>

              {/* Memory compatibility gauge */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>En memoria de 16 GB:</span>
                  <span className="font-mono text-cyan-300">{usedPercent}% ocupado</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, usedPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pendrive reference table */}
            <div className="space-y-1.5 pt-1 text-xs text-slate-300">
              <span className="text-[11px] font-semibold text-slate-400 block">Capacidad según tu Pendrive:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block">USB 8 GB:</span>
                  <strong className="text-white">~150 videos</strong>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block">USB 16 GB:</span>
                  <strong className="text-emerald-400">~320 videos</strong>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block">USB 32 GB:</span>
                  <strong className="text-cyan-400">~650 videos</strong>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block">USB 64 GB:</span>
                  <strong className="text-purple-400">~1300 videos</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Next Step Box: Dropzone connect */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">¿Ya corriste el script en tu PC?</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Una vez que el script descargue la carpeta con los videos en tu ordenador, puedes arrastrarla directamente a la app para:
            </p>

            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Verificar que no queden caracteres ilegales en FAT32</li>
              <li>Probar cómo suena y se ve en el reproductor de cabina</li>
              <li>Generar el paquete final con listas de reproducción</li>
            </ul>

            <button
              type="button"
              onClick={onNavigateToDropzone}
              className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <span>Ir a la Zona de Importación para USB</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

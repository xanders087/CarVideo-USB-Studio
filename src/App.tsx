import React, { useState, useEffect, useRef } from 'react';
import { Header, AppTab } from './components/Header';
import { AddVideosView } from './components/AddVideosView';
import { UsbManagerView } from './components/UsbManagerView';
import { CarInfotainmentView } from './components/CarInfotainmentView';
import { LegalRightsModal } from './components/LegalRightsModal';
import { LicenseInspectorModal } from './components/LicenseInspectorModal';
import { FolderAudioRepairTool } from './components/FolderAudioRepairTool';
import { AnalyzedLocalFile, CarVideoGenre, CarVideoItem } from './types/media';
import { dedupeVideos } from './utils/mediaHelpers';
import { Disc3, ShieldCheck } from 'lucide-react';

function revokeUnusedBlobUrls(
  candidateUrls: string[],
  activeUsb: CarVideoItem[],
  activeImported: AnalyzedLocalFile[],
  activePreviewUrl?: string
): void {
  const inUse = new Set<string>([
    ...activeUsb.map((v) => v.videoStreamUrl),
    ...activeImported.map((f) => f.url),
  ]);
  if (activePreviewUrl) {
    inUse.add(activePreviewUrl);
  }
  for (const url of candidateUrls) {
    if (url.startsWith('blob:') && !inUse.has(url)) {
      URL.revokeObjectURL(url);
    }
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('add');
  const [usbVideos, setUsbVideos] = useState<CarVideoItem[]>([]);
  const [importedFiles, setImportedFiles] = useState<AnalyzedLocalFile[]>([]);
  const [currentCarVideo, setCurrentCarVideo] = useState<CarVideoItem | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('carvideo_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    root.dataset.theme = theme;
    try {
      localStorage.setItem('carvideo_theme', theme);
    } catch {
      // Ignore storage failures in restricted sandboxes
    }
  }, [theme]);

  const usbVideosRef = useRef<CarVideoItem[]>([]);
  const importedFilesRef = useRef<AnalyzedLocalFile[]>([]);
  const currentCarVideoRef = useRef<CarVideoItem | null>(null);
  usbVideosRef.current = usbVideos;
  importedFilesRef.current = importedFiles;
  currentCarVideoRef.current = currentCarVideo;

  useEffect(() => {
    return () => {
      const urls = new Set<string>();
      for (const v of usbVideosRef.current) {
        if (v.videoStreamUrl.startsWith('blob:')) urls.add(v.videoStreamUrl);
      }
      for (const f of importedFilesRef.current) {
        if (f.url.startsWith('blob:')) urls.add(f.url);
      }
      const previewUrl = currentCarVideoRef.current?.videoStreamUrl;
      if (previewUrl?.startsWith('blob:')) urls.add(previewUrl);
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [inspectingVideo, setInspectingVideo] = useState<CarVideoItem | null>(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  const handleAddToUsb = (incoming: CarVideoItem[]): number => {
    const { added, merged } = dedupeVideos(usbVideos, incoming);
    if (added.length > 0) {
      setUsbVideos(merged);
      if (!currentCarVideo) {
        setCurrentCarVideo(added[0]);
      }
    }
    return added.length;
  };

  const handleSelectCarVideo = (video: CarVideoItem) => {
    const prevUrl = currentCarVideo?.videoStreamUrl;
    setCurrentCarVideo(video);
    if (prevUrl && prevUrl !== video.videoStreamUrl) {
      revokeUnusedBlobUrls([prevUrl], usbVideos, importedFiles, video.videoStreamUrl);
    }
  };

  const handlePlayInCar = (video: CarVideoItem) => {
    handleSelectCarVideo(video);
    setActiveTab('car');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveFromUsb = (id: string) => {
    const removed = usbVideos.find((v) => v.id === id);
    const remaining = usbVideos.filter((v) => v.id !== id);
    const nextPreview = currentCarVideo?.id === id ? (remaining[0] ?? null) : currentCarVideo;
    setUsbVideos(remaining);
    if (currentCarVideo?.id === id) {
      setCurrentCarVideo(nextPreview);
    }
    if (removed) {
      revokeUnusedBlobUrls(
        [removed.videoStreamUrl],
        remaining,
        importedFiles,
        nextPreview?.videoStreamUrl
      );
    }
  };

  const handleClearUsb = () => {
    const candidateUrls = usbVideos.map((v) => v.videoStreamUrl);
    if (currentCarVideo) {
      candidateUrls.push(currentCarVideo.videoStreamUrl);
    }
    setUsbVideos([]);
    setCurrentCarVideo(null);
    revokeUnusedBlobUrls(candidateUrls, [], importedFiles, undefined);
  };

  const handleAddImportedFiles = (newFiles: AnalyzedLocalFile[]) => {
    setImportedFiles((prev) => [...newFiles, ...prev]);
  };

  const handleRemoveImportedFile = (id: string) => {
    const removed = importedFiles.find((f) => f.id === id);
    const remaining = importedFiles.filter((f) => f.id !== id);
    setImportedFiles(remaining);
    if (removed) {
      revokeUnusedBlobUrls(
        [removed.url],
        usbVideos,
        remaining,
        currentCarVideo?.videoStreamUrl
      );
    }
  };

  const handleUpdateGenre = (id: string, genre: CarVideoGenre) => {
    setUsbVideos((prev) => prev.map((v) => (v.id === id ? { ...v, genre } : v)));
    setCurrentCarVideo((prev) => (prev?.id === id ? { ...prev, genre } : prev));
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } flex flex-col font-sans transition-colors duration-200`}
    >
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        usbCount={usbVideos.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenRepairTool={() => setIsRepairModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div hidden={activeTab !== 'add'} className={activeTab === 'add' ? undefined : 'hidden'}>
          <AddVideosView
            usbVideos={usbVideos}
            importedFiles={importedFiles}
            onAddImportedFiles={handleAddImportedFiles}
            onRemoveImportedFile={handleRemoveImportedFile}
            onAddToUsb={handleAddToUsb}
            onPreviewInCar={handlePlayInCar}
            onGoToUsb={() => setActiveTab('usb')}
            onOpenRepairTool={() => setIsRepairModalOpen(true)}
          />
        </div>

        {activeTab === 'usb' && (
          <UsbManagerView
            videos={usbVideos}
            onRemoveVideo={handleRemoveFromUsb}
            onClearAll={handleClearUsb}
            onPlayInCar={handlePlayInCar}
            onNavigateToAdd={() => setActiveTab('add')}
            onOpenRepairTool={() => setIsRepairModalOpen(true)}
            onUpdateGenre={handleUpdateGenre}
          />
        )}

        {activeTab === 'car' && (
          <CarInfotainmentView
            currentVideo={currentCarVideo}
            playlistVideos={usbVideos}
            onSelectVideo={handleSelectCarVideo}
            onOpenLicenseDetails={setInspectingVideo}
            onNavigateToAdd={() => setActiveTab('add')}
            onOpenRepairTool={() => setIsRepairModalOpen(true)}
          />
        )}
      </main>

      <LicenseInspectorModal
        video={inspectingVideo}
        onClose={() => setInspectingVideo(null)}
      />

      <FolderAudioRepairTool
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
      />

      <LegalRightsModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      <footer className="bg-slate-950 border-t border-slate-900 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Disc3 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">CarVideo USB Studio</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">MP4 H.264 + AAC · FAT32</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLegalModalOpen(true)}
            className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Marco Legal y Copia Privada</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

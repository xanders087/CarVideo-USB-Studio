import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { AddVideosView } from './components/AddVideosView';
import { UsbManagerView } from './components/UsbManagerView';
import { CarInfotainmentView } from './components/CarInfotainmentView';
import { LegalRightsModal } from './components/LegalRightsModal';
import { LicenseInspectorModal } from './components/LicenseInspectorModal';
import { FolderAudioRepairTool } from './components/FolderAudioRepairTool';
import { CarVideoItem } from './types/media';
import { dedupeVideos } from './utils/mediaHelpers';
import { Disc3, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('add');
  const [usbVideos, setUsbVideos] = useState<CarVideoItem[]>([]);
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
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('carvideo_theme', theme);
    } catch {
      // Ignore storage failures in restricted sandboxes
    }
  }, [theme]);

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

  const handlePlayInCar = (video: CarVideoItem) => {
    setCurrentCarVideo(video);
    setActiveTab('car');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveFromUsb = (id: string) => {
    setUsbVideos((prev) => {
      const remaining = prev.filter((v) => v.id !== id);
      if (currentCarVideo?.id === id) {
        setCurrentCarVideo(remaining[0] ?? null);
      }
      return remaining;
    });
  };

  const handleClearUsb = () => {
    setUsbVideos([]);
    setCurrentCarVideo(null);
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
        {activeTab === 'add' && (
          <AddVideosView
            usbVideos={usbVideos}
            onAddToUsb={handleAddToUsb}
            onPreviewInCar={handlePlayInCar}
            onGoToUsb={() => setActiveTab('usb')}
            onOpenRepairTool={() => setIsRepairModalOpen(true)}
          />
        )}

        {activeTab === 'usb' && (
          <UsbManagerView
            videos={usbVideos}
            onRemoveVideo={handleRemoveFromUsb}
            onClearAll={handleClearUsb}
            onPlayInCar={handlePlayInCar}
            onNavigateToAdd={() => setActiveTab('add')}
            onOpenRepairTool={() => setIsRepairModalOpen(true)}
          />
        )}

        {activeTab === 'car' && (
          <CarInfotainmentView
            currentVideo={currentCarVideo}
            playlistVideos={usbVideos}
            onSelectVideo={setCurrentCarVideo}
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

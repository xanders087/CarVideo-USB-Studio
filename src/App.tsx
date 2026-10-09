import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { WebDownloaderView } from './components/WebDownloaderView';
import { UsbStagingQueue } from './components/UsbStagingQueue';
import { CarInfotainmentView } from './components/CarInfotainmentView';
import { UsbDriveManager } from './components/UsbDriveManager';
import { LegalRightsView } from './components/LegalRightsView';
import { LicenseInspectorModal } from './components/LicenseInspectorModal';
import { PlaylistModal } from './components/PlaylistModal';
import { FolderAudioRepairTool } from './components/FolderAudioRepairTool';
import { INITIAL_CURATED_VIDEOS, INITIAL_PLAYLISTS } from './data/curatedVideos';
import { CarVideoItem, Playlist } from './types/media';
import { Sun, Moon, Disc3 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('web-downloader');
  const [videos, setVideos] = useState<CarVideoItem[]>(INITIAL_CURATED_VIDEOS);
  const [stagingVideos, setStagingVideos] = useState<CarVideoItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  
  // Theme state: default to 'dark' with persistence in localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('carvideo_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  });

  // Sync theme class and data-theme attribute with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    try {
      localStorage.setItem('carvideo_theme', theme);
    } catch {
      // Ignore localStorage exceptions in restrictive sandboxes
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  // Selected video for car cockpit playback (null when queue is empty)
  const [currentCarVideo, setCurrentCarVideo] = useState<CarVideoItem | null>(null);
  
  // Modals state
  const [inspectingVideo, setInspectingVideo] = useState<CarVideoItem | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);

  // Play a video directly in Car Cockpit Mode
  const handlePlayInCar = (video: CarVideoItem) => {
    setCurrentCarVideo(video);
    setActiveTab('car-mode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add items to USB Staging Queue
  const handleAddToStaging = (newItems: CarVideoItem[]) => {
    setStagingVideos(prev => {
      // Prevent duplicates by title & artist
      const existingIds = new Set(prev.map(v => `${v.title.toLowerCase()}-${v.artist.toLowerCase()}`));
      const filtered = newItems.filter(item => !existingIds.has(`${item.title.toLowerCase()}-${item.artist.toLowerCase()}`));
      const updated = [...filtered, ...prev];
      if (!currentCarVideo && updated.length > 0) {
        setCurrentCarVideo(updated[0]);
      }
      return updated;
    });
  };

  const handleRemoveFromStaging = (id: string) => {
    setStagingVideos(prev => {
      const remaining = prev.filter(v => v.id !== id);
      if (currentCarVideo?.id === id) {
        setCurrentCarVideo(remaining[0] || (videos[0] ?? null));
      }
      return remaining;
    });
  };

  const handleClearStaging = () => {
    setStagingVideos([]);
    if (!videos.length) {
      setCurrentCarVideo(null);
    }
  };

  // Commit staged videos to the permanent library
  const handleCommitToLibrary = (stagedToCommit: CarVideoItem[]) => {
    setVideos(prev => {
      const existingIds = new Set(prev.map(v => `${v.title.toLowerCase()}-${v.artist.toLowerCase()}`));
      const fresh = stagedToCommit.filter(v => !existingIds.has(`${v.title.toLowerCase()}-${v.artist.toLowerCase()}`));
      return [...fresh, ...prev];
    });
    alert(`¡${stagedToCommit.length} videos añadidos a la biblioteca!`);
  };

  // Add video to a playlist
  const handleAddToPlaylist = (videoId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        const alreadyIn = pl.videoIds.includes(videoId);
        return {
          ...pl,
          videoIds: alreadyIn ? pl.videoIds.filter(id => id !== videoId) : [...pl.videoIds, videoId]
        };
      }
      return pl;
    }));
  };

  const handleCreatePlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      videoIds: []
    };
    setPlaylists(prev => [...prev, newPl]);
  };

  const handleRemovePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Top Header conforming to 3-zone contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        videoCount={videos.length}
        stagingCount={stagingVideos.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onQuickExport={() => {
          if (stagingVideos.length > 0) {
            setActiveTab('staging');
          } else {
            setActiveTab('usb-manager');
          }
        }}
        onOpenRepairTool={() => setIsRepairModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab 1: Web Downloader & Connected Audio Engine (Core Hub) */}
        {activeTab === 'web-downloader' && (
          <WebDownloaderView
            onAddToStagingQueue={handleAddToStaging}
            onPreviewInCar={handlePlayInCar}
            stagingCount={stagingVideos.length}
            onGoToStaging={() => setActiveTab('staging')}
            playlists={playlists}
          />
        )}

        {/* Tab 2: USB Staging Tray */}
        {activeTab === 'staging' && (
          <UsbStagingQueue
            stagingVideos={stagingVideos}
            onRemoveFromStaging={handleRemoveFromStaging}
            onClearStaging={handleClearStaging}
            onCommitToLibrary={handleCommitToLibrary}
            onPlayInCar={handlePlayInCar}
            onNavigateToSearch={() => setActiveTab('web-downloader')}
            playlists={playlists}
          />
        )}

        {/* Tab 3: Car Cockpit Infotainment Preview & Diagnostics */}
        {activeTab === 'car-mode' && (
          <CarInfotainmentView
            currentVideo={currentCarVideo}
            playlistVideos={stagingVideos.length > 0 ? stagingVideos : videos}
            onSelectVideo={setCurrentCarVideo}
            onOpenLicenseDetails={setInspectingVideo}
            onNavigateToWebDownloader={() => setActiveTab('web-downloader')}
            onClearQueue={handleClearStaging}
          />
        )}

        {/* Tab 4: USB Flash Drive Manager & Organizers */}
        {activeTab === 'usb-manager' && (
          <UsbDriveManager
            videos={videos}
            playlists={playlists}
            onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
          />
        )}

        {/* Tab 5: Legal Rights & Transparency Hub */}
        {activeTab === 'licenses' && (
          <LegalRightsView />
        )}

      </main>

      {/* License Inspector Modal */}
      <LicenseInspectorModal
        video={inspectingVideo}
        onClose={() => setInspectingVideo(null)}
      />

      {/* Playlist Manager Modal */}
      {isPlaylistModalOpen && (
        <PlaylistModal
          playlists={playlists}
          videos={videos}
          onCreatePlaylist={handleCreatePlaylist}
          onRemovePlaylist={handleRemovePlaylist}
          onClose={() => setIsPlaylistModalOpen(false)}
        />
      )}

      {/* Folder Audio Repair Tool Modal (1-Click Solution) */}
      {isRepairModalOpen && (
        <FolderAudioRepairTool
          isModal={true}
          onClose={() => setIsRepairModalOpen(false)}
          onNavigateToDropzone={() => {
            setIsRepairModalOpen(false);
            setActiveTab('web-downloader');
          }}
        />
      )}

      {/* Automotive Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Disc3 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">CarVideo USB Studio</span>
            <span aria-hidden="true">·</span>
            <span>Optimizador de Videos MP4 con Audio para Coche</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button 
              onClick={() => setActiveTab('web-downloader')} 
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Descargas Web
            </button>
            <span aria-hidden="true">·</span>
            <button 
              onClick={() => setActiveTab('staging')} 
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Cola USB ({stagingVideos.length})
            </button>
            <span aria-hidden="true">·</span>
            <button 
              onClick={() => setActiveTab('car-mode')} 
              className="text-slate-400 hover:text-amber-400 transition-colors"
            >
              Consola de Auto
            </button>
            <span aria-hidden="true">·</span>
            <button 
              onClick={() => setActiveTab('usb-manager')} 
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Gestor USB
            </button>
            <span aria-hidden="true">·</span>
            <button 
              onClick={() => setActiveTab('licenses')} 
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Marco Legal y Copia Privada
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">MP4 (H.264 + AAC)</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Alternar entre tema claro y oscuro"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Tema Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-cyan-600" />
                  <span>Tema Oscuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

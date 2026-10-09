import React, { useState } from 'react';
import { X, Plus, Music, Trash2, Check } from 'lucide-react';
import { Playlist, CarVideoItem } from '../types/media';

interface PlaylistModalProps {
  playlists: Playlist[];
  videos: CarVideoItem[];
  onCreatePlaylist: (name: string, description: string) => void;
  onRemovePlaylist: (playlistId: string) => void;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  playlists,
  videos,
  onCreatePlaylist,
  onRemovePlaylist,
  onClose
}) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreatePlaylist(newName.trim(), newDesc.trim() || 'Lista personalizada para estéreo de vehículo');
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-display">
              Listas de Reproducción para el Coche
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* New Playlist Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-semibold text-white">Crear Nueva Lista de Viaje</h4>
            <div>
              <input
                type="text"
                placeholder="Nombre de la lista (ej. Carretera Tropical)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Lista</span>
            </button>
          </form>

          {/* Current Playlists */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Listas Existentes ({playlists.length})</h4>
            {playlists.map(pl => {
              const count = pl.videoIds.length;
              return (
                <div 
                  key={pl.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80"
                >
                  <div className="truncate mr-3">
                    <div className="text-white font-bold">{pl.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{pl.description}</div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{count} {count === 1 ? 'video' : 'videos'} asignados</div>
                  </div>

                  <button
                    onClick={() => onRemovePlaylist(pl.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                    title="Eliminar lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

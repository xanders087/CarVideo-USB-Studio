export type VideoResolution = '1080p' | '720p' | '480p';

export type LicenseType = 
  | 'Creative Commons (CC-BY)' 
  | 'Creative Commons (CC0)' 
  | 'Royalty-Free' 
  | 'Dominio Público' 
  | 'Autorizado para Uso Personal';

export interface LicenseDetails {
  type: LicenseType;
  holder: string;
  attribution: string;
  sourceUrl?: string;
  carPlaybackAllowed: boolean;
  legalNotice: string;
}

export interface CarVideoItem {
  id: string;
  title: string;
  artist: string;
  genre: 'Vallenato' | 'Salsa' | 'Cumbia' | 'Regional Mexicano' | 'Bachata' | 'Synthwave' | 'Rock' | 'Electrónica' | 'Pop Latino' | 'Lo-Fi Hip-Hop' | 'Reggaeton' | 'Acústico';
  durationSeconds: number;
  durationFormatted: string;
  resolution: VideoResolution;
  fps: number;
  videoCodec: string; // e.g. "H.264 (High Profile)"
  audioCodec: string; // e.g. "AAC Estéreo (320 kbps)"
  fileSizeMb: number;
  thumbnailUrl: string;
  videoStreamUrl: string; // Playable MP4 video URL
  youtubeId?: string;
  youtubeUrl?: string;
  license: LicenseDetails;
  addedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  videoIds: string[];
}

export type UsbOrganizationMode = 'by-genre' | 'by-playlist';

export interface UsbExportSettings {
  organizationMode: UsbOrganizationMode;
  targetFileSystem: 'FAT32' | 'exFAT' | 'NTFS';
  cleanFilenamesForStereos: boolean;
  generateM3uPlaylists: boolean;
  addTrackNumberPrefix: boolean;
  volumeNormalizationNotice: boolean;
}

export interface StereoCompatibilityReport {
  isFat32Safe: boolean;
  warnings: string[];
  codecNotice: string;
  audioSpec: string;
  totalSizeMb: number;
}

export interface AiMusicRecommendation {
  id?: string;
  title: string;
  artist: string;
  recordLabel: string;
  genre: CarVideoItem['genre'];
  durationFormatted: string;
  durationSeconds: number;
  estimatedSizeMb: number;
  resolution: VideoResolution;
  youtubeId?: string;
  reasonForDrive: string;
  selected?: boolean;
}


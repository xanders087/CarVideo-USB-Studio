export type VideoResolution = '1080p' | '720p' | '480p' | 'Sin verificar';

export const CAR_VIDEO_GENRES = [
  'Vallenato',
  'Salsa',
  'Cumbia',
  'Regional Mexicano',
  'Bachata',
  'Rock',
  'Pop Latino',
  'Reggaeton',
  'Electrónica',
  'Synthwave',
  'Lo-Fi Hip-Hop',
  'Acústico',
  'Otros',
] as const;

export type CarVideoGenre = (typeof CAR_VIDEO_GENRES)[number];

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
  genre: CarVideoGenre;
  durationSeconds: number;
  durationFormatted: string;
  resolution: VideoResolution;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  fileSizeMb: number;
  thumbnailUrl: string;
  videoStreamUrl: string;
  license: LicenseDetails;
  addedAt: string;
}

export type UsbOrganizationMode = 'by-genre' | 'flat';

export interface UsbExportSettings {
  organizationMode: UsbOrganizationMode;
  cleanFilenamesForStereos: boolean;
  generateM3uPlaylists: boolean;
  addTrackNumberPrefix: boolean;
}

export interface StereoCompatibilityReport {
  isFat32Safe: boolean;
  warnings: string[];
  codecNotice: string;
  audioSpec: string;
  totalSizeMb: number;
}

export interface ArchiveSearchResult {
  id: string;
  identifier: string;
  title: string;
  artist: string;
  year: string | number;
  downloads: number;
  format: string;
  fileSizeMb: number;
  durationFormatted: string;
  durationSeconds: number;
  resolution: VideoResolution;
  videoCodec: string;
  audioCodec: string;
  downloadUrl: string;
  videoStreamUrl?: string;
  streamUrl?: string;
  source: string;
  licenseType: string;
}

export interface AnalyzedLocalFile {
  id: string;
  file: File;
  name: string;
  sizeMb: number;
  cleanTitle: string;
  safeCarName: string;
  url: string;
  durationSeconds: number;
  durationFormatted: string;
  resolution: VideoResolution;
  status: 'ready' | 'added';
  isSilentStream: boolean;
  isOpusOrVorbis: boolean;
  videoCodec: string;
  audioCodec: string;
  isMetadataVerified: boolean;
  streamFormatNote?: string;
  suggestedFfmpegCommand?: string;
}

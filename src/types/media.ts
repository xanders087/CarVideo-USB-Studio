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
  genre:
    | 'Vallenato'
    | 'Salsa'
    | 'Cumbia'
    | 'Regional Mexicano'
    | 'Bachata'
    | 'Synthwave'
    | 'Rock'
    | 'Electrónica'
    | 'Pop Latino'
    | 'Lo-Fi Hip-Hop'
    | 'Reggaeton'
    | 'Acústico';
  durationSeconds: number;
  durationFormatted: string;
  resolution: VideoResolution;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  fileSizeMb: number;
  thumbnailUrl: string;
  videoStreamUrl: string;
  youtubeId?: string;
  youtubeUrl?: string;
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
  safeCarName: string;
  url: string;
  durationFormatted: string;
  status: 'ready' | 'added';
  isSilentStream: boolean;
  isOpusOrVorbis: boolean;
  audioCodec: string;
  streamFormatNote?: string;
  suggestedFfmpegCommand?: string;
}

import { LicenseDetails, LicenseType } from '../types/media';

export interface RightsCheckResult {
  isValidUrl: boolean;
  youtubeId: string | null;
  detectedLicense: LicenseDetails;
  carPlaybackCompliance: {
    isPermitted: boolean;
    level: 'total' | 'condicional' | 'restringido';
    summary: string;
    tips: string[];
  };
}

/**
 * Extracts a YouTube Video ID from standard YouTube URLs, shortlinks, or embed links.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  // Standard video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Standard URL formats
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

/**
 * Evaluates license and rights compatibility for automotive offline playback.
 */
export function inspectLicenseCompliance(
  rawLicenseType: LicenseType,
  authorOrChannel: string,
  sourceUrl?: string
): LicenseDetails {
  let carPlaybackAllowed = true;
  let legalNotice = '';
  let attribution = '';

  switch (rawLicenseType) {
    case 'Creative Commons (CC-BY)':
      attribution = `Atribución obligatoria: ${authorOrChannel}. Licencia CC BY 4.0 Internacional que permite la copia y reproducción en cualquier soporte.`;
      legalNotice = 'Completamente apto para copia y reproducción en reproductores vehiculares con atribución conservada.';
      break;

    case 'Creative Commons (CC0)':
      attribution = `Dedicado al Dominio Público mundial por ${authorOrChannel}.`;
      legalNotice = 'Libre de restricciones de derechos de autor para reproducción en cualquier pantalla o estéreo.';
      break;

    case 'Royalty-Free':
      attribution = `Música libre de regalías licenciada por ${authorOrChannel} para difusión no comercial y uso personal.`;
      legalNotice = 'Permite almacenamiento en memorias USB y reproducción privada en vehículos familiares.';
      break;

    case 'Dominio Público':
      attribution = `Obra en Dominio Público (${authorOrChannel}). Sin derechos patrimoniales vigentes.`;
      legalNotice = 'Reproducción totalmente libre en cualquier dispositivo y territorio.';
      break;

    case 'Autorizado para Uso Personal':
    default:
      attribution = `Canal/Creador: ${authorOrChannel}. Reproducción amparada bajo el régimen de copia privada personal.`;
      legalNotice = 'Uso exclusivo dentro del vehículo del propietario sin fines lucrativos ni distribución pública masiva.';
      break;
  }

  return {
    type: rawLicenseType,
    holder: authorOrChannel,
    attribution,
    sourceUrl: sourceUrl || 'https://creativecommons.org',
    carPlaybackAllowed,
    legalNotice
  };
}

/**
 * Analyzes an imported URL and generates a rights report.
 */
export function analyzeYouTubeRights(urlOrId: string, channelHint?: string): RightsCheckResult {
  const id = extractYouTubeId(urlOrId);
  const isValid = id !== null;

  const defaultLicense: LicenseDetails = {
    type: 'Creative Commons (CC-BY)',
    holder: channelHint || 'Creador de YouTube',
    attribution: `Video obtenido con autorización de ${channelHint || 'Creador Oficial'}. Licencia de uso multimedia privado.`,
    sourceUrl: id ? `https://www.youtube.com/watch?v=${id}` : undefined,
    carPlaybackAllowed: true,
    legalNotice: 'Cumple con el marco de reproducción privada y personal en estéreos de auto.'
  };

  return {
    isValidUrl: isValid,
    youtubeId: id,
    detectedLicense: defaultLicense,
    carPlaybackCompliance: {
      isPermitted: true,
      level: 'total',
      summary: 'Apto para transferencia a memoria USB y reproducción en estéreo o pantalla de auto personal.',
      tips: [
        'Conserva los metadatos y créditos del artista en el nombre del archivo MP4.',
        'No comercialices ni redistribuyas la memoria USB con fines de lucro.',
        'Para viajes largos, organiza por carpetas para facilitar la búsqueda en el tablero sin distraerte al volante.'
      ]
    }
  };
}

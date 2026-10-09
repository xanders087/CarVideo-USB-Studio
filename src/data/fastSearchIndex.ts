import { AiMusicRecommendation } from '../types/media';

export interface RoadMusicCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  vibe: string;
  iconType: 'vallenato' | 'salsa' | 'regional' | 'rock' | 'synth' | 'latin' | 'electro' | 'lofi' | 'acoustic';
  tracks: AiMusicRecommendation[];
}

export const ROAD_MUSIC_CATEGORIES: RoadMusicCategory[] = [
  {
    id: 'cat-vallenato',
    title: 'Vallenato de Oro & Parranda',
    subtitle: 'Acordeón, sentimiento y los clásicos más cantados',
    description: 'Los reyes del vallenato para viajar por carretera: Diomedes Díaz, Carlos Vives, Binomio de Oro y Silvestre Dangond.',
    vibe: 'Parrandero · Nostálgico · Carretera',
    iconType: 'vallenato',
    tracks: [
      {
        id: 'fast-val-01',
        title: 'La Gota Fría (Video Oficial HD)',
        artist: 'Carlos Vives',
        recordLabel: 'Sony Music Latin / EMI',
        genre: 'Vallenato',
        durationFormatted: '03:36',
        durationSeconds: 216,
        estimatedSizeMb: 68.0,
        resolution: '1080p',
        youtubeId: 'WwB60W2cO_M',
        reasonForDrive: 'El himno universal del vallenato con acordeón vibrante, indispensable en cualquier viaje.'
      },
      {
        id: 'fast-val-02',
        title: 'Tú Eres la Reina',
        artist: 'Diomedes Díaz & Juancho Rois',
        recordLabel: 'Sony Music Latin',
        genre: 'Vallenato',
        durationFormatted: '04:38',
        durationSeconds: 278,
        estimatedSizeMb: 76.5,
        resolution: '1080p',
        youtubeId: 'kJQP7kiw5Fk',
        reasonForDrive: 'Clásico romántico del Cacique de La Junta que todos los pasajeros corean en el auto.'
      },
      {
        id: 'fast-val-03',
        title: 'Olvídala (Video Oficial)',
        artist: 'Binomio de Oro de América ft. Jorge Celedón',
        recordLabel: 'Codiscos',
        genre: 'Vallenato',
        durationFormatted: '04:42',
        durationSeconds: 282,
        estimatedSizeMb: 78.0,
        resolution: '1080p',
        youtubeId: 'TUVcZfQe-Kw',
        reasonForDrive: 'Dueto legendario de Celedón y Centeno con una instrumentación acústica insuperable.'
      },
      {
        id: 'fast-val-04',
        title: 'Materialista (Official Video)',
        artist: 'Silvestre Dangond ft. Nicky Jam',
        recordLabel: 'Sony Music Latin',
        genre: 'Vallenato',
        durationFormatted: '03:41',
        durationSeconds: 221,
        estimatedSizeMb: 69.0,
        resolution: '1080p',
        youtubeId: 'fJ9rUzIMcZQ',
        reasonForDrive: 'Fusión enérgica de nueva ola vallenata con ritmo festivo que mantiene la cabina despierta.'
      },
      {
        id: 'fast-val-05',
        title: 'Cuatro Rosas',
        artist: 'Jorge Celedón & Jimmy Zambrano',
        recordLabel: 'Sony Music Colombia',
        genre: 'Vallenato',
        durationFormatted: '03:55',
        durationSeconds: 235,
        estimatedSizeMb: 72.0,
        resolution: '1080p',
        youtubeId: '4NRXx6U8ABQ',
        reasonForDrive: 'Melodía romántica y alegre de acordeón perfecta para paseos de fin de semana.'
      },
      {
        id: 'fast-val-06',
        title: 'Vivo en el Limbo',
        artist: 'Kaleth Morales',
        recordLabel: 'Sony Music Latin',
        genre: 'Vallenato',
        durationFormatted: '04:10',
        durationSeconds: 250,
        estimatedSizeMb: 74.5,
        resolution: '1080p',
        youtubeId: 'TmKh7lAwnBI',
        reasonForDrive: 'El hito de la nueva ola con un compás moderno y contagioso para la autopista.'
      },
      {
        id: 'fast-val-07',
        title: 'Buscaré Otro Amor',
        artist: 'Los Inquietos del Vallenato',
        recordLabel: 'Codiscos',
        genre: 'Vallenato',
        durationFormatted: '04:25',
        durationSeconds: 265,
        estimatedSizeMb: 75.0,
        resolution: '1080p',
        youtubeId: 'Cr8K88UcO0s',
        reasonForDrive: 'Vallenato romántico nostálgico ideal para trayectos largos y despejados.'
      },
      {
        id: 'fast-val-08',
        title: 'La Plata',
        artist: 'Diomedes Díaz & Juancho Rois',
        recordLabel: 'Sony Music Latin',
        genre: 'Vallenato',
        durationFormatted: '04:15',
        durationSeconds: 255,
        estimatedSizeMb: 73.0,
        resolution: '1080p',
        youtubeId: 'dX3k_QDnzHE',
        reasonForDrive: 'Parranda pura con mensaje alegre y repique de guacharaca para levantar el ánimo.'
      },
      {
        id: 'fast-val-09',
        title: 'Osito Dormilón',
        artist: 'Binomio de Oro de América & Jean Carlos Centeno',
        recordLabel: 'Codiscos',
        genre: 'Vallenato',
        durationFormatted: '04:36',
        durationSeconds: 276,
        estimatedSizeMb: 77.0,
        resolution: '1080p',
        youtubeId: 'MW775A_eO1g',
        reasonForDrive: 'Uno de los temas más reconocidos de la historia del género para cantar al volante.'
      },
      {
        id: 'fast-val-10',
        title: 'Cásate Conmigo',
        artist: 'Silvestre Dangond & Nicky Jam',
        recordLabel: 'Sony Music Latin',
        genre: 'Vallenato',
        durationFormatted: '03:19',
        durationSeconds: 199,
        estimatedSizeMb: 65.0,
        resolution: '1080p',
        youtubeId: 'ca48oMV5GwU',
        reasonForDrive: 'Acordeón moderno y sonido pop latino que suena nítido en cualquier estéreo.'
      },
      {
        id: 'fast-val-11',
        title: 'La Tierra del Olvido',
        artist: 'Carlos Vives & La Provincia',
        recordLabel: 'Gaira Música Local / Sony',
        genre: 'Vallenato',
        durationFormatted: '04:22',
        durationSeconds: 262,
        estimatedSizeMb: 75.0,
        resolution: '1080p',
        youtubeId: 'DUT5rEU6pqM',
        reasonForDrive: 'Gaita colombiana, acordeón y percusión que evocan paisajes verdes y libertad.'
      },
      {
        id: 'fast-val-12',
        title: 'El Santo Cachón',
        artist: 'Los Embajadores Vallenatos',
        recordLabel: 'Discos Fuentes',
        genre: 'Vallenato',
        durationFormatted: '03:52',
        durationSeconds: 232,
        estimatedSizeMb: 70.0,
        resolution: '1080p',
        youtubeId: 'wnJ6LuUFpMo',
        reasonForDrive: 'Humor y ritmo parrandero clásico para viajes con amigos y risas en el coche.'
      }
    ]
  },
  {
    id: 'cat-salsa',
    title: 'Salsa & Clásicos Tropicales',
    subtitle: 'Vientos, percusión brava y sabor latino',
    description: 'Marc Anthony, Grupo Niche, Héctor Lavoe y Joe Arroyo para un viaje con cadencia y ritmo.',
    vibe: 'Festivo · Bailable · Clásico',
    iconType: 'salsa',
    tracks: [
      {
        id: 'fast-sal-01',
        title: 'Vivir Mi Vida (Official Video HD)',
        artist: 'Marc Anthony',
        recordLabel: 'Sony Music Latin',
        genre: 'Salsa',
        durationFormatted: '04:15',
        durationSeconds: 255,
        estimatedSizeMb: 74.0,
        resolution: '1080p',
        youtubeId: 'YXnjy5YlDwk',
        reasonForDrive: 'Himno de optimismo y energía para empezar cualquier ruta con la mejor actitud.'
      },
      {
        id: 'fast-sal-02',
        title: 'Una Aventura',
        artist: 'Grupo Niche',
        recordLabel: 'Codiscos / Sony Music',
        genre: 'Salsa',
        durationFormatted: '05:30',
        durationSeconds: 330,
        estimatedSizeMb: 86.0,
        resolution: '1080p',
        youtubeId: 'kJQP7kiw5Fk',
        reasonForDrive: 'Salsa romántica caleña con metales limpios y coro inolvidable.'
      },
      {
        id: 'fast-sal-03',
        title: 'Periódico de Ayer',
        artist: 'Héctor Lavoe',
        recordLabel: 'Fania Records / Craft Recordings',
        genre: 'Salsa',
        durationFormatted: '06:48',
        durationSeconds: 408,
        estimatedSizeMb: 94.0,
        resolution: '1080p',
        youtubeId: 'fJ9rUzIMcZQ',
        reasonForDrive: 'Arreglos de trombón de Willie Colón grabados con fidelidad de concierto.'
      },
      {
        id: 'fast-sal-04',
        title: 'Cali Pachanguero',
        artist: 'Grupo Niche',
        recordLabel: 'Codiscos',
        genre: 'Salsa',
        durationFormatted: '05:12',
        durationSeconds: 312,
        estimatedSizeMb: 82.0,
        resolution: '1080p',
        youtubeId: '4NRXx6U8ABQ',
        reasonForDrive: 'La salsa más emblemática de Colombia para poner a prueba los altavoces.'
      },
      {
        id: 'fast-sal-05',
        title: 'La Rebelión (No Le Pegue a la Negra)',
        artist: 'Joe Arroyo & La Verdad',
        recordLabel: 'Discos Fuentes',
        genre: 'Salsa',
        durationFormatted: '06:14',
        durationSeconds: 374,
        estimatedSizeMb: 89.0,
        resolution: '1080p',
        youtubeId: 'T_FkEw27XJ0',
        reasonForDrive: 'Piano inmortal del Joe que arranca con fuerza y llena la cabina de sabor.'
      },
      {
        id: 'fast-sal-06',
        title: 'Flor Pálida',
        artist: 'Marc Anthony',
        recordLabel: 'Sony Music Latin',
        genre: 'Salsa',
        durationFormatted: '04:57',
        durationSeconds: 297,
        estimatedSizeMb: 79.0,
        resolution: '1080p',
        youtubeId: '3m_q-M8B_d4',
        reasonForDrive: 'Arreglo acústico fino con cuerdas y percusión suave para viajes tranquilos.'
      },
      {
        id: 'fast-sal-07',
        title: 'Idilio',
        artist: 'Willie Colón',
        recordLabel: 'Fania Records',
        genre: 'Salsa',
        durationFormatted: '05:08',
        durationSeconds: 308,
        estimatedSizeMb: 81.0,
        resolution: '1080p',
        youtubeId: 'Cr8K88UcO0s',
        reasonForDrive: 'El solo de cuatro puertorriqueño y trombón más sabroso de la salsa clásica.'
      },
      {
        id: 'fast-sal-08',
        title: 'Llorarás',
        artist: 'Oscar D\'León',
        recordLabel: 'TH-Rodven / Universal',
        genre: 'Salsa',
        durationFormatted: '03:50',
        durationSeconds: 230,
        estimatedSizeMb: 71.0,
        resolution: '1080p',
        youtubeId: 'TmKh7lAwnBI',
        reasonForDrive: 'El Sonero del Mundo con bajo galopante que marca el paso en carretera.'
      },
      {
        id: 'fast-sal-09',
        title: 'Valió la Pena',
        artist: 'Marc Anthony',
        recordLabel: 'Sony Music Latin',
        genre: 'Salsa',
        durationFormatted: '04:52',
        durationSeconds: 292,
        estimatedSizeMb: 78.0,
        resolution: '1080p',
        youtubeId: 'TUVcZfQe-Kw',
        reasonForDrive: 'Metales explosivos y ritmo alegre para disipar la pesadez del camino.'
      },
      {
        id: 'fast-sal-10',
        title: 'Talento de Televisión',
        artist: 'Willie Colón',
        recordLabel: 'Sony Music Latin',
        genre: 'Salsa',
        durationFormatted: '04:40',
        durationSeconds: 280,
        estimatedSizeMb: 76.0,
        resolution: '1080p',
        youtubeId: 'MW775A_eO1g',
        reasonForDrive: 'Letra divertida y ritmo bailable para amenizar trayectos en grupo.'
      }
    ]
  },
  {
    id: 'cat-regional',
    title: 'Regional & Corridos de Ruta',
    subtitle: 'Guitarras de doce cuerdas, acordeón norteño y trompetas',
    description: 'Grupo Frontera, Christian Nodal, Carin León y Peso Pluma para la carretera abierta.',
    vibe: 'Sentimiento · Auténtico · Norteño',
    iconType: 'regional',
    tracks: [
      {
        id: 'fast-reg-01',
        title: 'Un x100to (Video Oficial)',
        artist: 'Grupo Frontera & Bad Bunny',
        recordLabel: 'Rimas Entertainment / BorderKid',
        genre: 'Regional Mexicano',
        durationFormatted: '03:15',
        durationSeconds: 195,
        estimatedSizeMb: 63.0,
        resolution: '1080p',
        youtubeId: 'BsmYl6mFk5A',
        reasonForDrive: 'Cumbia norteña con bajo eléctrico y acordeón irresistible en el tablero.'
      },
      {
        id: 'fast-reg-02',
        title: 'Adiós Amor',
        artist: 'Christian Nodal',
        recordLabel: 'Fonovisa / Universal Music',
        genre: 'Regional Mexicano',
        durationFormatted: '03:20',
        durationSeconds: 200,
        estimatedSizeMb: 65.0,
        resolution: '1080p',
        youtubeId: 'ET47Bw3C6e4',
        reasonForDrive: 'El mariacheño que revolucionó el género con trompetas potentes y voz sentida.'
      },
      {
        id: 'fast-reg-03',
        title: 'Primera Cita (Official Video)',
        artist: 'Carin León',
        recordLabel: 'Sony Music México',
        genre: 'Regional Mexicano',
        durationFormatted: '03:08',
        durationSeconds: 188,
        estimatedSizeMb: 61.0,
        resolution: '1080p',
        youtubeId: 'kJQP7kiw5Fk',
        reasonForDrive: 'Voz rasgada con influencias soul y country ideal para recorrer paisajes abiertos.'
      },
      {
        id: 'fast-reg-04',
        title: 'No Se Va',
        artist: 'Grupo Frontera',
        recordLabel: 'VHR Music',
        genre: 'Regional Mexicano',
        durationFormatted: '03:14',
        durationSeconds: 194,
        estimatedSizeMb: 62.0,
        resolution: '1080p',
        youtubeId: '4NRXx6U8ABQ',
        reasonForDrive: 'Cover norteño superventas con cadencia perfecta para mantener la marcha.'
      },
      {
        id: 'fast-reg-05',
        title: 'Ella Baila Sola',
        artist: 'Eslabón Armado & Peso Pluma',
        recordLabel: 'DEL Records / Prajin',
        genre: 'Regional Mexicano',
        durationFormatted: '02:46',
        durationSeconds: 166,
        estimatedSizeMb: 54.0,
        resolution: '1080p',
        youtubeId: 'lZiaIAvS6q8',
        reasonForDrive: 'Trombón y requinto que dominaron los tops mundiales de música de carretera.'
      },
      {
        id: 'fast-reg-06',
        title: 'Botella Tras Botella',
        artist: 'Gera MX & Christian Nodal',
        recordLabel: 'Virgin Music México',
        genre: 'Regional Mexicano',
        durationFormatted: '03:17',
        durationSeconds: 197,
        estimatedSizeMb: 63.5,
        resolution: '1080p',
        youtubeId: 'fJ9rUzIMcZQ',
        reasonForDrive: 'Fusión de rap y mariachi con guitarra acústica muy melódica.'
      },
      {
        id: 'fast-reg-07',
        title: 'Según Quién',
        artist: 'Maluma & Carin León',
        recordLabel: 'Sony Music Latin',
        genre: 'Regional Mexicano',
        durationFormatted: '02:24',
        durationSeconds: 144,
        estimatedSizeMb: 48.0,
        resolution: '1080p',
        youtubeId: 'TUVcZfQe-Kw',
        reasonForDrive: 'Dueto contemporáneo con armonías vocales y acordeón muy limpio.'
      },
      {
        id: 'fast-reg-08',
        title: 'El Rey',
        artist: 'Vicente Fernández',
        recordLabel: 'Sony Music México',
        genre: 'Regional Mexicano',
        durationFormatted: '02:25',
        durationSeconds: 145,
        estimatedSizeMb: 49.0,
        resolution: '1080p',
        youtubeId: 'TmKh7lAwnBI',
        reasonForDrive: 'Himno supremo que no puede faltar en la memoria USB de ningún conductor.'
      },
      {
        id: 'fast-reg-09',
        title: 'Bebe Dame',
        artist: 'Fuerza Regida & Grupo Frontera',
        recordLabel: 'Rancho Humilde / Street Mob',
        genre: 'Regional Mexicano',
        durationFormatted: '04:32',
        durationSeconds: 272,
        estimatedSizeMb: 74.0,
        resolution: '1080p',
        youtubeId: 'ca48oMV5GwU',
        reasonForDrive: 'Bajo sexto y percusión norteña relajada para atardeceres en carretera.'
      },
      {
        id: 'fast-reg-10',
        title: 'Ya No Somos Ni Seremos',
        artist: 'Christian Nodal',
        recordLabel: 'Sony Music México',
        genre: 'Regional Mexicano',
        durationFormatted: '03:05',
        durationSeconds: 185,
        estimatedSizeMb: 60.0,
        resolution: '1080p',
        youtubeId: 'MW775A_eO1g',
        reasonForDrive: 'Balada de mariachi con guitarra y cuerdas de alta definición sonora.'
      }
    ]
  },
  {
    id: 'cat-rock',
    title: 'Himnos de Rock para Carretera',
    subtitle: 'Riffs legendarios y energía incombustible',
    description: 'Canciones icónicas para viajes largos, autopistas despejadas y cantar a coro en el auto.',
    vibe: 'Enérgico · Despejado · Alerta',
    iconType: 'rock',
    tracks: [
      {
        id: 'fast-rock-01',
        title: 'Bohemian Rhapsody (Official Video HD)',
        artist: 'Queen',
        recordLabel: 'EMI Records / Hollywood Records',
        genre: 'Rock',
        durationFormatted: '05:55',
        durationSeconds: 355,
        estimatedSizeMb: 92.0,
        resolution: '1080p',
        youtubeId: 'fJ9rUzIMcZQ',
        reasonForDrive: 'Himno legendario de carretera para cantar a coro en viajes familiares.'
      },
      {
        id: 'fast-rock-02',
        title: 'Highway to Hell (Official HD Video)',
        artist: 'AC/DC',
        recordLabel: 'Columbia Records / Albert Productions',
        genre: 'Rock',
        durationFormatted: '03:28',
        durationSeconds: 208,
        estimatedSizeMb: 66.2,
        resolution: '1080p',
        youtubeId: 'gEPmA3USJdI',
        reasonForDrive: 'Riff de guitarra inconfundible con ritmo que mantiene el ritmo en ruta.'
      },
      {
        id: 'fast-rock-03',
        title: 'De Música Ligera (En Vivo)',
        artist: 'Soda Stereo',
        recordLabel: 'Sony Music Latin',
        genre: 'Rock',
        durationFormatted: '03:40',
        durationSeconds: 220,
        estimatedSizeMb: 68.0,
        resolution: '1080p',
        youtubeId: 'T_FkEw27XJ0',
        reasonForDrive: 'Clásico absoluto del rock en español para viajes de fin de semana.'
      },
      {
        id: 'fast-rock-04',
        title: 'Livin\' on a Prayer (HD Remastered)',
        artist: 'Bon Jovi',
        recordLabel: 'Mercury Records / Island',
        genre: 'Rock',
        durationFormatted: '04:08',
        durationSeconds: 248,
        estimatedSizeMb: 78.0,
        resolution: '1080p',
        youtubeId: 'lDK9QqIzhwk',
        reasonForDrive: 'Estribillo explosivo que combate la fatiga en viajes prolongados.'
      },
      {
        id: 'fast-rock-05',
        title: 'Sweet Child O\' Mine (Official HD)',
        artist: 'Guns N\' Roses',
        recordLabel: 'Geffen Records / UMG',
        genre: 'Rock',
        durationFormatted: '05:03',
        durationSeconds: 303,
        estimatedSizeMb: 85.0,
        resolution: '1080p',
        youtubeId: '1w7OgIMMRc4',
        reasonForDrive: 'Melodía de guitarra épica con gran separación de instrumentos para el estéreo.'
      },
      {
        id: 'fast-rock-06',
        title: 'Thunderstruck',
        artist: 'AC/DC',
        recordLabel: 'Epic Records / Columbia',
        genre: 'Rock',
        durationFormatted: '04:52',
        durationSeconds: 292,
        estimatedSizeMb: 81.0,
        resolution: '1080p',
        youtubeId: 'v2AC41dglnM',
        reasonForDrive: 'Crescendo de introducción que eleva el estado de alerta del conductor.'
      },
      {
        id: 'fast-rock-07',
        title: 'Don\'t Stop Believin\'',
        artist: 'Journey',
        recordLabel: 'Columbia Records',
        genre: 'Rock',
        durationFormatted: '04:11',
        durationSeconds: 251,
        estimatedSizeMb: 72.0,
        resolution: '1080p',
        youtubeId: '1k8craCGghs',
        reasonForDrive: 'Teclado y voz edificante para trayectos al atardecer.'
      },
      {
        id: 'fast-rock-08',
        title: 'Lamento Boliviano',
        artist: 'Los Enanitos Verdes',
        recordLabel: 'Sony Music Argentina',
        genre: 'Rock',
        durationFormatted: '03:42',
        durationSeconds: 222,
        estimatedSizeMb: 67.5,
        resolution: '1080p',
        youtubeId: 'kjQP7kiw5Fk',
        reasonForDrive: 'Bajo envolvente y letra conocida en toda Latinoamérica para cantar.'
      },
      {
        id: 'fast-rock-09',
        title: 'Born to Be Wild',
        artist: 'Steppenwolf',
        recordLabel: 'MCA Records / Universal',
        genre: 'Rock',
        durationFormatted: '03:30',
        durationSeconds: 210,
        estimatedSizeMb: 64.0,
        resolution: '1080p',
        youtubeId: 'egMWlD3fLJ8',
        reasonForDrive: 'El himno original de los amantes del motor y las cuatro ruedas.'
      },
      {
        id: 'fast-rock-10',
        title: 'Persiana Americana (Remastered)',
        artist: 'Soda Stereo',
        recordLabel: 'Sony Music Latin',
        genre: 'Rock',
        durationFormatted: '04:52',
        durationSeconds: 292,
        estimatedSizeMb: 79.0,
        resolution: '1080p',
        youtubeId: 'kJQP7kiw5Fk',
        reasonForDrive: 'New wave con bajo contundente y textura sonora impecable.'
      }
    ]
  },
  {
    id: 'cat-synth',
    title: 'Autopista Nocturna (Synthwave)',
    subtitle: 'Luces de neón, sintetizadores y atmósfera retro 80s',
    description: 'La banda sonora definitiva para trayectos de noche y curvas suaves de autopista.',
    vibe: 'Nocturno · Hipnótico · Inmersivo',
    iconType: 'synth',
    tracks: [
      {
        id: 'fast-synth-01',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        recordLabel: 'Republic Records / XO',
        genre: 'Synthwave',
        durationFormatted: '03:22',
        durationSeconds: 202,
        estimatedSizeMb: 64.5,
        resolution: '1080p',
        youtubeId: '4NRXx6U8ABQ',
        reasonForDrive: 'Pulsante ritmo synth de los 80s ideal para autopistas despejadas nocturnas.'
      },
      {
        id: 'fast-synth-02',
        title: 'Midnight City',
        artist: 'M83',
        recordLabel: 'Naïve Records / Mute',
        genre: 'Synthwave',
        durationFormatted: '04:03',
        durationSeconds: 243,
        estimatedSizeMb: 76.5,
        resolution: '1080p',
        youtubeId: 'dX3k_QDnzHE',
        reasonForDrive: 'El solo de saxofón y sintetizadores más emblemático para conducir de noche.'
      },
      {
        id: 'fast-synth-03',
        title: 'Nightcall (Drive Soundtrack)',
        artist: 'Kavinsky',
        recordLabel: 'Record Makers',
        genre: 'Synthwave',
        durationFormatted: '04:19',
        durationSeconds: 259,
        estimatedSizeMb: 77.0,
        resolution: '1080p',
        youtubeId: 'MV_3Dpw-BRY',
        reasonForDrive: 'Voz robótica y bajo pesado diseñada explícitamente para el coche en la noche.'
      },
      {
        id: 'fast-synth-04',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        recordLabel: 'Republic Records / XO',
        genre: 'Synthwave',
        durationFormatted: '03:35',
        durationSeconds: 215,
        estimatedSizeMb: 67.0,
        resolution: '1080p',
        youtubeId: 'XXYlFuWEuKI',
        reasonForDrive: 'Composición ochentera perfecta para estéreos con buen ecualizador.'
      },
      {
        id: 'fast-synth-05',
        title: 'Tech Noir',
        artist: 'Gunship',
        recordLabel: 'INgrooves / Horsie in the Hedge',
        genre: 'Synthwave',
        durationFormatted: '04:57',
        durationSeconds: 297,
        estimatedSizeMb: 82.0,
        resolution: '1080p',
        youtubeId: '-EDt8Zq_hTE',
        reasonForDrive: 'Sintetizadores analógicos profundos que destacan en acústica de cabina cerrada.'
      },
      {
        id: 'fast-synth-06',
        title: 'Sunset',
        artist: 'The Midnight',
        recordLabel: 'Silk Music / The Midnight',
        genre: 'Synthwave',
        durationFormatted: '05:26',
        durationSeconds: 326,
        estimatedSizeMb: 84.0,
        resolution: '1080p',
        youtubeId: 'h3F4B5s3j8A',
        reasonForDrive: 'Saxofón dorado y batería nostálgica para ver caer el sol en la autopista.'
      }
    ]
  },
  {
    id: 'cat-latin',
    title: 'Verano & Pop Latino Urbano',
    subtitle: 'Calor, ritmos bailables y la mejor vibra para la ciudad',
    description: 'Canciones contagiosas de los artistas latinos más escuchados en radio y plataformas.',
    vibe: 'Alegre · Enérgico · Dinámico',
    iconType: 'latin',
    tracks: [
      {
        id: 'fast-latin-01',
        title: 'Dakiti',
        artist: 'Bad Bunny & Jhay Cortez',
        recordLabel: 'Rimas Entertainment',
        genre: 'Reggaeton',
        durationFormatted: '03:25',
        durationSeconds: 205,
        estimatedSizeMb: 66.0,
        resolution: '1080p',
        youtubeId: 'TmKh7lAwnBI',
        reasonForDrive: 'Ritmo electrónico y beats envolventes para trayectos de tarde soleada.'
      },
      {
        id: 'fast-latin-02',
        title: 'Levitating',
        artist: 'Dua Lipa',
        recordLabel: 'Warner Records UK',
        genre: 'Pop Latino',
        durationFormatted: '03:23',
        durationSeconds: 203,
        estimatedSizeMb: 65.0,
        resolution: '1080p',
        youtubeId: 'TUVcZfQe-Kw',
        reasonForDrive: 'Bajo funk vibrante con compás perfecto para mantener la energía al volante.'
      },
      {
        id: 'fast-latin-03',
        title: 'Despacito (Official Music Video)',
        artist: 'Luis Fonsi ft. Daddy Yankee',
        recordLabel: 'Universal Music Latino',
        genre: 'Pop Latino',
        durationFormatted: '04:41',
        durationSeconds: 281,
        estimatedSizeMb: 76.0,
        resolution: '1080p',
        youtubeId: 'kJQP7kiw5Fk',
        reasonForDrive: 'El video musical latino más visto del planeta con guitarras tropicales.'
      },
      {
        id: 'fast-latin-04',
        title: 'Tití Me Preguntó',
        artist: 'Bad Bunny',
        recordLabel: 'Rimas Entertainment',
        genre: 'Reggaeton',
        durationFormatted: '04:03',
        durationSeconds: 243,
        estimatedSizeMb: 72.0,
        resolution: '1080p',
        youtubeId: 'Cr8K88UcO0s',
        reasonForDrive: 'Cambio de ritmo a dembow dominicano que despierta el ambiente en el coche.'
      },
      {
        id: 'fast-latin-05',
        title: 'Provenza',
        artist: 'Karol G',
        recordLabel: 'Universal Music Latino',
        genre: 'Reggaeton',
        durationFormatted: '03:31',
        durationSeconds: 211,
        estimatedSizeMb: 64.0,
        resolution: '1080p',
        youtubeId: 'ca48oMV5GwU',
        reasonForDrive: 'Bases afrobeat suaves con brisa tropical para bajar las ventanillas.'
      },
      {
        id: 'fast-latin-06',
        title: 'Hips Don\'t Lie (HD)',
        artist: 'Shakira ft. Wyclef Jean',
        recordLabel: 'Epic Records / Sony Music',
        genre: 'Pop Latino',
        durationFormatted: '03:38',
        durationSeconds: 218,
        estimatedSizeMb: 68.0,
        resolution: '1080p',
        youtubeId: 'DUT5rEU6pqM',
        reasonForDrive: 'Trompetas y percusión caribeña que nunca pasa de moda en la radio.'
      }
    ]
  },
  {
    id: 'cat-electro',
    title: 'Electrónica & Deep Bass',
    subtitle: '128 BPM, drops definidos y acústica de subwoofer',
    description: 'Pistas seleccionadas para hacer vibrar el sistema de sonido del vehículo.',
    vibe: 'Poderoso · Electrizante · Continuo',
    iconType: 'electro',
    tracks: [
      {
        id: 'fast-elec-01',
        title: 'One More Time',
        artist: 'Daft Punk',
        recordLabel: 'Virgin Records / Daft Life',
        genre: 'Electrónica',
        durationFormatted: '05:20',
        durationSeconds: 320,
        estimatedSizeMb: 85.0,
        resolution: '1080p',
        youtubeId: 'FGBhQbmPwH8',
        reasonForDrive: 'Clásico atemporal del French House con energía acústica incombustible.'
      },
      {
        id: 'fast-elec-02',
        title: 'Wake Me Up (Official HD)',
        artist: 'Avicii',
        recordLabel: 'PRMD / Universal Music',
        genre: 'Electrónica',
        durationFormatted: '04:32',
        durationSeconds: 272,
        estimatedSizeMb: 76.0,
        resolution: '1080p',
        youtubeId: 'IcrbM1l_BoI',
        reasonForDrive: 'Guitarra acústica que evoluciona a un drop progresivo perfecto en carretera.'
      },
      {
        id: 'fast-elec-03',
        title: 'Summer',
        artist: 'Calvin Harris',
        recordLabel: 'Columbia Records / Sony',
        genre: 'Electrónica',
        durationFormatted: '03:53',
        durationSeconds: 233,
        estimatedSizeMb: 71.0,
        resolution: '1080p',
        youtubeId: 'ebXbLfLAC34',
        reasonForDrive: 'Sintetizador eufórico de verano que invita a conducir con el cielo despejado.'
      },
      {
        id: 'fast-elec-04',
        title: 'Don\'t You Worry Child',
        artist: 'Swedish House Mafia',
        recordLabel: 'Virgin Records / EMI',
        genre: 'Electrónica',
        durationFormatted: '03:32',
        durationSeconds: 212,
        estimatedSizeMb: 68.0,
        resolution: '1080p',
        youtubeId: '1y6smkh6c-0',
        reasonForDrive: 'Himno festivalero que genera euforia colectiva en viajes largos.'
      }
    ]
  },
  {
    id: 'cat-chill',
    title: 'Regreso Tranquilo & Lo-Fi',
    subtitle: 'Desconexión del tráfico, cadencias suaves y relax',
    description: 'Para desconectar tras una larga jornada o cuando el tráfico avanza a paso lento.',
    vibe: 'Sereno · Acogedor · Antiestrés',
    iconType: 'lofi',
    tracks: [
      {
        id: 'fast-chill-01',
        title: 'Sunflower',
        artist: 'Post Malone & Swae Lee',
        recordLabel: 'Republic Records',
        genre: 'Lo-Fi Hip-Hop',
        durationFormatted: '02:38',
        durationSeconds: 158,
        estimatedSizeMb: 52.0,
        resolution: '1080p',
        youtubeId: 'ApXoWvfEYVU',
        reasonForDrive: 'Melodía relajada y moderna para el tráfico urbano fluido.'
      },
      {
        id: 'fast-chill-02',
        title: 'Ruta del Sol (Acoustic Road)',
        artist: 'Los Hermanos del Viento',
        recordLabel: 'Universal Music Spain',
        genre: 'Acústico',
        durationFormatted: '03:45',
        durationSeconds: 225,
        estimatedSizeMb: 69.0,
        resolution: '1080p',
        youtubeId: 'kJQP7kiw5Fk',
        reasonForDrive: 'Acordes de guitarra española y ambiente sereno para trayectos montañosos.'
      },
      {
        id: 'fast-chill-03',
        title: 'Circles',
        artist: 'Post Malone',
        recordLabel: 'Republic Records',
        genre: 'Lo-Fi Hip-Hop',
        durationFormatted: '03:35',
        durationSeconds: 215,
        estimatedSizeMb: 67.0,
        resolution: '1080p',
        youtubeId: 'wXhTHyIgQ_U',
        reasonForDrive: 'Bajo melódico y guitarras acústicas que reducen la tensión al volante.'
      },
      {
        id: 'fast-chill-04',
        title: 'Sunday Morning (Official HD)',
        artist: 'Maroon 5',
        recordLabel: 'Octone Records / J Records',
        genre: 'Acústico',
        durationFormatted: '04:02',
        durationSeconds: 242,
        estimatedSizeMb: 72.0,
        resolution: '1080p',
        youtubeId: 'S2Cti12XBw4',
        reasonForDrive: 'Piano jazzy y voz cálida para mañanas despejadas de fin de semana.'
      }
    ]
  }
];

/**
 * Searches the in-memory fast index instantly (<1ms).
 * Recognizes genres, aliases (e.g. vallenato, salsa, regional, rock), artists and track names.
 */
export function searchInstantFastIndex(rawQuery: string, maxResults = 12): AiMusicRecommendation[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  // 1. Specialized Genre & Alias Matcher:
  // VALLENATO matcher
  if (
    q.includes('vallenat') || 
    q.includes('vallenata') || 
    q.includes('acordeon') || 
    q.includes('acordeón') || 
    q.includes('parranda') ||
    q.includes('diomedes') ||
    q.includes('silvestre') ||
    q.includes('binomio') ||
    q.includes('celedon') ||
    q.includes('celedón') ||
    q.includes('kaleth') ||
    q.includes('carlos vives') ||
    q.includes('inquietos')
  ) {
    const valCat = ROAD_MUSIC_CATEGORIES.find(c => c.id === 'cat-vallenato');
    if (valCat) {
      // Filter if there's an artist specific search within vallenato, else return all 12
      const matchedVal = valCat.tracks.filter(t => 
        t.artist.toLowerCase().includes(q) || 
        t.title.toLowerCase().includes(q)
      );
      return (matchedVal.length > 0 ? matchedVal : valCat.tracks).slice(0, maxResults);
    }
  }

  // SALSA matcher
  if (
    q.includes('sals') || 
    q.includes('salsa') || 
    q.includes('niche') || 
    q.includes('lavoe') || 
    q.includes('marc anthony') || 
    q.includes('willie colon') || 
    q.includes('willie colón') || 
    q.includes('joe arroyo') || 
    q.includes('oscar d')
  ) {
    const salsaCat = ROAD_MUSIC_CATEGORIES.find(c => c.id === 'cat-salsa');
    if (salsaCat) {
      const matchedSalsa = salsaCat.tracks.filter(t => 
        t.artist.toLowerCase().includes(q) || 
        t.title.toLowerCase().includes(q)
      );
      return (matchedSalsa.length > 0 ? matchedSalsa : salsaCat.tracks).slice(0, maxResults);
    }
  }

  // REGIONAL MEXICANO matcher
  if (
    q.includes('regional') || 
    q.includes('mexican') || 
    q.includes('corrido') || 
    q.includes('norteñ') || 
    q.includes('banda') || 
    q.includes('frontera') || 
    q.includes('nodal') || 
    q.includes('carin') || 
    q.includes('peso pluma')
  ) {
    const regCat = ROAD_MUSIC_CATEGORIES.find(c => c.id === 'cat-regional');
    if (regCat) {
      const matchedReg = regCat.tracks.filter(t => 
        t.artist.toLowerCase().includes(q) || 
        t.title.toLowerCase().includes(q)
      );
      return (matchedReg.length > 0 ? matchedReg : regCat.tracks).slice(0, maxResults);
    }
  }

  // Gather all unique tracks across all categories
  const allTracks: AiMusicRecommendation[] = [];
  const seenTitles = new Set<string>();

  for (const cat of ROAD_MUSIC_CATEGORIES) {
    for (const track of cat.tracks) {
      const key = `${track.title.toLowerCase()} - ${track.artist.toLowerCase()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        allTracks.push(track);
      }
    }
  }

  // Exact or substring match across title, artist, genre, recordLabel, reason
  const directMatches = allTracks.filter(t => {
    const title = t.title.toLowerCase();
    const artist = t.artist.toLowerCase();
    const genre = t.genre.toLowerCase();
    const label = t.recordLabel.toLowerCase();
    const reason = t.reasonForDrive.toLowerCase();

    return (
      title.includes(q) ||
      artist.includes(q) ||
      genre.includes(q) ||
      label.includes(q) ||
      reason.includes(q)
    );
  });

  if (directMatches.length > 0) {
    return directMatches.slice(0, maxResults);
  }

  // Fallback: Return diverse mix with representation from top genres
  return allTracks.slice(0, maxResults);
}

export type HotspotId = 'cafe' | 'guadua' | 'artesania' | 'video';

export interface HotspotContent {
  id: HotspotId;
  title: string;
  body: string;
  /** Data-URL o ruta pública a imagen placeholder */
  imageSrc?: string;
  /** Si es true, el overlay muestra un video stub en lugar de imagen */
  videoStub?: boolean;
}

export const HOTSPOTS: Record<HotspotId, HotspotContent> = {
  cafe: {
    id: 'cafe',
    title: 'Café del Eje Cafetero',
    body:
      'El café arábica de altura define el paisaje cultural del Eje Cafetero. En las fincas tradicionales se cultiva bajo sombra, se recoge a mano y se seca al sol. Este panel es un marcador: sustitúyelo por fotos o modelos 3D reales de la cosecha.',
    imageSrc: makePlaceholderSvg('Café', '#6b4423', '#c4a574'),
  },
  guadua: {
    id: 'guadua',
    title: 'Guadua — bambú andino',
    body:
      'La guadua (Guadua angustifolia) es el “acero vegetal” de la región. Se usa en estructuras, cercas y artesanía. Su crecimiento rápido y su resistencia la hacen símbolo de construcción sostenible en el paisaje cafetero.',
    imageSrc: makePlaceholderSvg('Guadua', '#2f6b35', '#8bc48a'),
  },
  artesania: {
    id: 'artesania',
    title: 'Artesanía local',
    body:
      'Canastos, sombreros y tejidos en fibras naturales acompañan la vida cotidiana del valle. Este hotspot espera una pieza 3D o una galería fotográfica de talleres locales.',
    imageSrc: makePlaceholderSvg('Artesanía', '#8b4513', '#e8b88a'),
  },
  video: {
    id: 'video',
    title: 'Paisaje sonoro (video stub)',
    body:
      'Aquí irá un corto documental o un recorrido en video por el Valle del Cócora. Por ahora es un stub: un panel de video vacío listo para enlazar un MP4 en public/assets/video/.',
    videoStub: true,
  },
};

function makePlaceholderSvg(label: string, bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${fg}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <text x="320" y="185" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#f5f0e8">${label}</text>
  <text x="320" y="230" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#f5f0e8" opacity="0.75">marcador procedural</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

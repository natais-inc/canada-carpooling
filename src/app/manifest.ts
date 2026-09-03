import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CarpoolWork',
    short_name: 'CarpoolWork',
    description: 'Covoiturage domicile-travail payé par l\'employeur / Employer-paid commuter carpooling',
    start_url: '/fr',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

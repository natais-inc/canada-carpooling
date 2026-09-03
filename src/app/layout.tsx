import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://carpoolwork.ca'),
  title: {
    default: 'CarpoolWork | Covoiturage domicile-travail payé par l\'employeur',
    template: '%s | CarpoolWork',
  },
  description: 'CarpoolWork organise la navette domicile-travail payée par l\'employeur. Des collègues covoiturent ensemble vers le même lieu de travail — gratuit pour les employés, moins de stationnement et moins d\'émissions pour l\'entreprise.',
  keywords: [
    'covoiturage domicile-travail', 'covoiturage entreprise', 'navette employeur',
    'covoiturage employés', 'commuter carpooling', 'employer carpooling',
    'workplace carpooling', 'covoiturage Canada', 'carpooling Canada',
    'réduction stationnement', 'mobilité durable entreprise',
  ],
  authors: [{ name: 'North American Technologies and AI solutions Inc.' }],
  creator: 'CarpoolWork',
  publisher: 'North American Technologies and AI solutions Inc.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    alternateLocale: 'en_CA',
    url: 'https://carpoolwork.ca',
    siteName: 'CarpoolWork',
    title: 'CarpoolWork | Covoiturage domicile-travail payé par l\'employeur',
    description: 'La navette domicile-travail organisée et payée par l\'employeur. Des collègues covoiturent ensemble; gratuit pour les employés.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CarpoolWork - Covoiturage domicile-travail payé par l\'employeur',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarpoolWork | Covoiturage domicile-travail payé par l\'employeur',
    description: 'La navette domicile-travail organisée et payée par l\'employeur. Gratuit pour les employés.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://carpoolwork.ca',
    languages: {
      'fr-CA': 'https://carpoolwork.ca/fr',
      'en-CA': 'https://carpoolwork.ca/en',
    },
  },
  verification: {
    google: 'GOOGLE_SITE_VERIFICATION_ID',
  },
  category: 'transportation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

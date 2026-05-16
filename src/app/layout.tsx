import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://canada-carpooling.vercel.app'),
  title: {
    default: 'Canada Carpooling | Covoiturage intercité au Canada',
    template: '%s | Canada Carpooling',
  },
  description: 'Covoiturage intercité au Canada. Trouvez ou offrez un trajet entre villes canadiennes. Économisez jusqu\'à 75% vs bus ou train. Seulement 1,99$ de frais de service.',
  keywords: [
    'covoiturage Canada', 'carpooling Canada', 'rideshare Canada',
    'covoiturage Montréal Toronto', 'covoiturage Québec',
    'carpooling Montreal', 'carpooling Toronto Ottawa',
    'intercity rideshare', 'covoiturage intercité',
    'trajet partagé Canada', 'partage de trajet',
  ],
  authors: [{ name: 'Canada Carpooling' }],
  creator: 'Canada Carpooling',
  publisher: 'Canada Carpooling',
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
    url: 'https://canada-carpooling.vercel.app',
    siteName: 'Canada Carpooling',
    title: 'Canada Carpooling | Covoiturage intercité au Canada',
    description: 'Trouvez ou offrez un trajet entre villes canadiennes. Économisez jusqu\'à 75%. Conducteurs vérifiés, seulement 1,99$ de frais.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Canada Carpooling - Covoiturage intercité',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canada Carpooling | Covoiturage intercité au Canada',
    description: 'Trouvez ou offrez un trajet entre villes canadiennes. Économisez jusqu\'à 75%.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://canada-carpooling.vercel.app',
    languages: {
      'fr-CA': 'https://canada-carpooling.vercel.app/fr',
      'en-CA': 'https://canada-carpooling.vercel.app/en',
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

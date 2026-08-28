import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/providers/AuthProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/consent/CookieConsent';
import ChatbotWidget from '@/components/ChatbotWidget';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEn = locale === 'en';
  return {
    title: isEn
      ? 'CarpoolWork | Intercity Ridesharing in Canada'
      : 'CarpoolWork | Covoiturage intercité au Canada',
    description: isEn
      ? 'Find or offer rides between Canadian cities. Save up to 75% vs bus or train. Verified drivers, only $1.99 service fee.'
      : 'Trouvez ou offrez un trajet entre villes canadiennes. Économisez jusqu\'à 75% vs bus ou train. Conducteurs vérifiés, seulement 1,99$ de frais.',
    alternates: {
      canonical: `https://carpoolwork.ca/${locale}`,
      languages: {
        'fr-CA': 'https://carpoolwork.ca/fr',
        'en-CA': 'https://carpoolwork.ca/en',
      },
    },
    openGraph: {
      locale: isEn ? 'en_CA' : 'fr_CA',
      alternateLocale: isEn ? 'fr_CA' : 'en_CA',
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CarpoolWork',
    url: `https://carpoolwork.ca/${locale}`,
    description: locale === 'en'
      ? 'Intercity carpooling platform connecting drivers and passengers across Canada'
      : 'Plateforme de covoiturage intercité connectant conducteurs et passagers à travers le Canada',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '1.99',
      priceCurrency: 'CAD',
      description: locale === 'en' ? 'Service fee per booking' : 'Frais de service par réservation',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
  };

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Header />
            <ErrorBoundary>
              <main className="flex-1">{children}</main>
            </ErrorBoundary>
            <Footer />
            <CookieConsent />
            <ChatbotWidget />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

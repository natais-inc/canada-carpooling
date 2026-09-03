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
      ? 'Employer-Paid Commuter Carpooling'
      : 'Covoiturage domicile-travail payé par l\'employeur',
    description: isEn
      ? 'Employer-paid, organized home-to-work carpooling. Coworkers commute together; free for employees. Less parking, fewer emissions.'
      : 'La navette domicile-travail organisée et payée par l\'employeur. Des collègues covoiturent ensemble; gratuit pour les employés, moins de stationnement et moins d\'émissions.',
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
      ? 'Employer-paid home-to-work carpooling connecting coworkers across Canada'
      : 'Covoiturage domicile-travail payé par l\'employeur, reliant les collègues à travers le Canada',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
      description: locale === 'en'
        ? 'Free for employees; paid by the employer'
        : 'Gratuit pour les employés; payé par l\'employeur',
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

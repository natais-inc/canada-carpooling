import type { Metadata } from 'next';
import { PRIVACY } from '@/lib/legal-content';
import LegalDocument from '@/components/LegalDocument';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const l = locale === 'en' ? 'en' : 'fr';
  return {
    title: PRIVACY[l].title,
    description: l === 'en'
      ? 'What CarpoolWork collects, why, where it is hosted, and your rights under PIPEDA.'
      : 'Ce que CarpoolWork recueille, pourquoi, où les données sont hébergées, et vos droits en vertu de la LPRPDE.',
    alternates: { canonical: `https://carpoolwork.ca/${l}/confidentialite`, languages: { 'fr-CA': 'https://carpoolwork.ca/fr/confidentialite', 'en-CA': 'https://carpoolwork.ca/en/confidentialite' } },
  };
}

export default function PrivacyPage({ params: { locale } }: { params: { locale: string } }) {
  return <LegalDocument doc={PRIVACY[locale === 'en' ? 'en' : 'fr']} />;
}

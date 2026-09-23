import type { Metadata } from 'next';
import { TERMS } from '@/lib/legal-content';
import LegalDocument from '@/components/LegalDocument';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const l = locale === 'en' ? 'en' : 'fr';
  return {
    title: TERMS[l].title,
    description: l === 'en'
      ? 'Terms of use of CarpoolWork: the service, cost-sharing carpooling, driver responsibilities, employer pricing and billing.'
      : 'Conditions d\'utilisation de CarpoolWork : le service, le covoiturage à frais partagés, les responsabilités du conducteur, la tarification et la facturation des employeurs.',
    alternates: { canonical: `https://carpoolwork.ca/${l}/conditions`, languages: { 'fr-CA': 'https://carpoolwork.ca/fr/conditions', 'en-CA': 'https://carpoolwork.ca/en/conditions' } },
  };
}

export default function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  return <LegalDocument doc={TERMS[locale === 'en' ? 'en' : 'fr']} />;
}

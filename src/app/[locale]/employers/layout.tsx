import type { Metadata } from 'next';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const isEn = locale === 'en';
  return {
    title: isEn ? 'For employers — 10-week pilot, $25 per active participant' : 'Employeurs — pilote de 10 semaines, 25 $ par participant actif',
    description: isEn
      ? 'Turnkey home-to-work carpooling for one worksite: 30-day free trial, then $25 per active participant per month ($500 per site minimum). Invoiced monthly, no card.'
      : 'Covoiturage domicile-travail clé en main pour un site : 30 jours d\'essai gratuit, puis 25 $ par participant actif et par mois (minimum 500 $ par site). Facturé mensuellement, sans carte.',
    alternates: { canonical: `https://carpoolwork.ca/${locale}/employers`, languages: { 'fr-CA': 'https://carpoolwork.ca/fr/employers', 'en-CA': 'https://carpoolwork.ca/en/employers' } },
  };
}

export default function EmployersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

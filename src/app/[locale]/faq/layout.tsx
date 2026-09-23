import type { Metadata } from 'next';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const isEn = locale === 'en';
  return {
    title: isEn ? 'FAQ — Employer-paid commuter carpooling' : 'FAQ — Covoiturage domicile-travail payé par l\'employeur',
    description: isEn
      ? 'Answers on how CarpoolWork works, pricing ($25 per active participant, $500 per site floor), billing, insurance and data protection.'
      : 'Réponses sur le fonctionnement de CarpoolWork, la tarification (25 $ par participant actif, plancher de 500 $ par site), la facturation, l\'assurance et la protection des données.',
    alternates: { canonical: `https://carpoolwork.ca/${locale}/faq`, languages: { 'fr-CA': 'https://carpoolwork.ca/fr/faq', 'en-CA': 'https://carpoolwork.ca/en/faq' } },
  };
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}

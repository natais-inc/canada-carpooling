import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Questions fréquentes',
  description: 'Réponses aux questions fréquentes sur le covoiturage avec Canada Carpooling. Sécurité, paiements, trajets, annulations et plus.',
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}

'use client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Car, Shield, HelpCircle, FileText } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Canada Carpooling</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">{t('description')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/about`} className="hover:text-white transition-colors">{t('about')}</Link></li>
              <li><Link href={`/${locale}/safety`} className="hover:text-white transition-colors">{t('safety')}</Link></li>
              <li><Link href={`/${locale}/help`} className="hover:text-white transition-colors">{t('help')}</Link></li>
              <li><Link href={`/${locale}/faq`} className="hover:text-white transition-colors">{t('faq')}</Link></li>
              <li><Link href={`/${locale}/employers`} className="hover:text-white transition-colors">{t('employers')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">{t('legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('terms')}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="hover:text-white transition-colors">{t('cookies')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">{t('copyright')}</p>
          <div className="flex items-center gap-4">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-400">{t('secure')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

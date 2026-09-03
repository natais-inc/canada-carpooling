'use client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Car, ShieldCheck, Mail } from 'lucide-react';

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
              <span className="text-xl font-bold text-white">CarpoolWork</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">{t('description')}</p>
            <p className="text-gray-500 text-xs mt-4">{t('byline')}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/employers`} className="hover:text-white transition-colors">{t('employers')}</Link></li>
              <li><Link href={`/${locale}/faq`} className="hover:text-white transition-colors">{t('faq')}</Link></li>
              <li><Link href={`/${locale}/blog`} className="hover:text-white transition-colors">{t('blog')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@carpoolwork.ca" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" /> support@carpoolwork.ca
                </a>
              </li>
              <li><Link href={`/${locale}/employer/inscription`} className="hover:text-white transition-colors">{t('startPilot')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">{t('copyright')}</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-400">{t('compliance')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

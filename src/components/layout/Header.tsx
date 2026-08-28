'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, MessageSquare, Car, Globe, LogOut, HelpCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // TODO: Replace with real session
  const session = null as any;

  const switchLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Carpool<span className="text-brand-600">Work</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={`/${locale}/trips/search`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('findRide')}
            </Link>
            <Link href={`/${locale}/trips/create`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('offerRide')}
            </Link>
            <Link href={`/${locale}/faq`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('faq')}
            </Link>
            <Link href={`/${locale}/employers`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('employers')}
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={switchLocale}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>

            {session ? (
              <div className="flex items-center gap-3">
                <Link href={`/${locale}/messages`} className="text-gray-600 hover:text-brand-600">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link href={`/${locale}/profile`}>
                  <Avatar name={session.user.name || ''} src={session.user.image} size="sm" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/auth/login`}>
                  <Button variant="ghost" size="sm">{t('login')}</Button>
                </Link>
                <Link href={`/${locale}/auth/register`}>
                  <Button size="sm">{t('register')}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/trips/search`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('findRide')}
              </Link>
              <Link href={`/${locale}/trips/create`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('offerRide')}
              </Link>
              <Link href={`/${locale}/faq`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('faq')}
              </Link>
              <Link href={`/${locale}/employers`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('employers')}
              </Link>
              <button onClick={switchLocale} className="flex items-center gap-1 text-gray-600 py-2">
                <Globe className="h-4 w-4" /> {locale === 'fr' ? 'English' : 'Français'}
              </button>
              <div className="flex gap-2 pt-2">
                <Link href={`/${locale}/auth/login`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">{t('login')}</Button>
                </Link>
                <Link href={`/${locale}/auth/register`} className="flex-1">
                  <Button size="sm" className="w-full">{t('register')}</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, MessageSquare, Car, Globe, LogOut, HelpCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // TODO: Replace with real session
  const session = null as any;

  const switchLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Canada <span className="text-brand-600">Carpooling</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={`/${locale}/trips/search`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('findRide')}
            </Link>
            <Link href={`/${locale}/trips/create`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('offerRide')}
            </Link>
            <Link href={`/${locale}/faq`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('faq')}
            </Link>
            <Link href={`/${locale}/employers`} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              {t('employers')}
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={switchLocale}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>

            {session ? (
              <div className="flex items-center gap-3">
                <Link href={`/${locale}/messages`} className="text-gray-600 hover:text-brand-600">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link href={`/${locale}/profile`}>
                  <Avatar name={session.user.name || ''} src={session.user.image} size="sm" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/auth/login`}>
                  <Button variant="ghost" size="sm">{t('login')}</Button>
                </Link>
                <Link href={`/${locale}/auth/register`}>
                  <Button size="sm">{t('register')}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/trips/search`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('findRide')}
              </Link>
              <Link href={`/${locale}/trips/create`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('offerRide')}
              </Link>
              <Link href={`/${locale}/faq`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('faq')}
              </Link>
              <Link href={`/${locale}/employers`} className="text-gray-600 hover:text-brand-600 font-medium py-2">
                {t('employers')}
              </Link>
              <button onClick={switchLocale} className="flex items-center gap-1 text-gray-600 py-2">
                <Globe className="h-4 w-4" /> {locale === 'fr' ? 'English' : 'Français'}
              </button>
              <div className="flex gap-2 pt-2">
                <Link href={`/${locale}/auth/login`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">{t('login')}</Button>
                </Link>
                <Link href={`/${locale}/auth/register`} className="flex-1">
                  <Button size="sm" className="w-full">{t('register')}</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

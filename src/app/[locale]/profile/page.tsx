'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import {
  Building2, Car, Shield, Globe, LogOut, MapPin, Loader2, ShieldCheck, UserRound,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

type Membership = {
  id: string;
  status: string;
  role?: string | null;
  department?: string | null;
  workSite?: string | null;
  company: { id: string; name: string; region?: string | null };
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [isEmployerAdmin, setIsEmployerAdmin] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const name = (session?.user as any)?.name || '';
  const email = session?.user?.email || '';

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/employee/memberships')
      .then((r) => (r.ok ? r.json() : { memberships: [] }))
      .then((d) => { if (!cancelled) setMemberships(d.memberships || []); })
      .catch(() => { if (!cancelled) setMemberships([]); });
    fetch('/api/employer/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setIsEmployerAdmin(!!d.isEmployerAdmin); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status]);

  const switchLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    const rest = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${rest}`);
  };

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <UserRound className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 mb-6">{t('signInPrompt')}</p>
        <Link href={`/${locale}/auth/login`} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          {t('signIn')}
        </Link>
      </div>
    );
  }

  const active = (memberships || []).filter((m) => m.status === 'ACTIVE');
  const invited = (memberships || []).filter((m) => m.status === 'INVITED');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('title')}</h1>
      <p className="text-gray-500 mb-8">{t('subtitle')}</p>

      {/* Identity card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={name || email} src={(session?.user as any)?.image} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 truncate">{name || t('noName')}</p>
            <p className="text-sm text-gray-500 truncate">{email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-maple-50 text-maple-700 rounded-full px-2 py-0.5">
                  <Shield className="h-3 w-3" /> {t('roleAdmin')}
                </span>
              )}
              {isEmployerAdmin && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">
                  <Building2 className="h-3 w-3" /> {t('roleEmployerAdmin')}
                </span>
              )}
              {active.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                  <Car className="h-3 w-3" /> {t('roleEmployee')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {(active.length > 0 || invited.length > 0) && (
          <Link href={`/${locale}/mon-covoiturage`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-500 transition-colors">
            <Car className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-medium text-gray-800">{t('goCarpool')}</span>
          </Link>
        )}
        {isEmployerAdmin && (
          <Link href={`/${locale}/employer`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-500 transition-colors">
            <Building2 className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-medium text-gray-800">{t('goEmployer')}</span>
          </Link>
        )}
        {isAdmin && (
          <Link href={`/${locale}/admin`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-500 transition-colors">
            <Shield className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-medium text-gray-800">{t('goAdmin')}</span>
          </Link>
        )}
        <button onClick={switchLocale} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-500 transition-colors text-left">
          <Globe className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-gray-800">{t('changeLanguage')}</span>
        </button>
      </div>

      {/* My companies */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('myCompanies')}</h2>
        {memberships === null ? (
          <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> …</p>
        ) : memberships.length === 0 ? (
          <div className="text-sm text-gray-500">
            <p>{t('noCompanies')}</p>
            <p className="text-gray-400 mt-1">{t('noCompaniesHint')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {memberships.map((m) => (
              <li key={m.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{m.company.name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-0.5">
                    {m.company.region && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.company.region}</span>}
                    {m.workSite && <span>{m.workSite}</span>}
                    {m.department && <span>{m.department}</span>}
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${
                  m.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {m.status === 'ACTIVE' ? t('statusActive') : t('statusInvited')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">{t('privacyTitle')}</h2>
            <p className="text-sm text-gray-600">{t('privacyText')}</p>
            <a href="mailto:support@carpoolwork.ca" className="text-sm font-medium text-brand-700 hover:text-brand-800 mt-2 inline-block">support@carpoolwork.ca</a>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: `/${locale}` })}
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <LogOut className="h-4 w-4" /> {t('signOut')}
      </button>
    </div>
  );
}

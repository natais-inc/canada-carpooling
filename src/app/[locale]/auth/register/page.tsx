'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, Car, Shield } from 'lucide-react';

// Only honour relative, single-slash callback paths (no open redirects).
function safeCallback(raw: string | null): string | null {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
}
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get('callbackUrl'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false,
  });

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    if (!form.acceptTerms) {
      setError(t('mustAcceptTerms'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const parts = form.name.trim().split(/\s+/);
      const firstName = parts[0] || form.name.trim();
      const lastName = parts.slice(1).join(' ') || firstName;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          preferredLanguage: locale === 'en' ? 'en' : 'fr',
          privacyPolicyAccepted: true,
          termsAccepted: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      // Auto sign-in after successful registration
      const signInRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInRes?.error) {
        const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : '';
        router.push(`/${locale}/auth/login?registered=true${cb}`);
        return;
      }
      router.push(callbackUrl || `/${locale}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('registerTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('registerSubtitle')}</p>
        </div>

        <Card>
          <CardBody className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="name" label={t('fullName')} placeholder="Jean Tremblay" value={form.name}
                onChange={e => update('name', e.target.value)} icon={<User className="h-4 w-4" />} required />
              <Input id="email" label={t('email')} type="email" placeholder="vous@exemple.com" value={form.email}
                onChange={e => update('email', e.target.value)} icon={<Mail className="h-4 w-4" />} required />
              <Input id="phone" label={t('phone')} type="tel" placeholder="+1 (514) 555-0123" value={form.phone}
                onChange={e => update('phone', e.target.value)} icon={<Phone className="h-4 w-4" />} required />
              <Input id="password" label={t('password')} type="password" placeholder="••••••••" value={form.password}
                onChange={e => update('password', e.target.value)} icon={<Lock className="h-4 w-4" />} required />
              <Input id="confirmPassword" label={t('confirmPassword')} type="password" placeholder="••••••••" value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)} icon={<Lock className="h-4 w-4" />} required />

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={form.acceptTerms} onChange={e => update('acceptTerms', e.target.checked)}
                  className="mt-1 rounded text-brand-600 focus:ring-brand-500 h-4 w-4" />
                <span className="text-sm text-gray-600">
                  {t('acceptTerms')}{' '}
                  <Link href={`/${locale}/terms`} className="text-brand-600 hover:underline">{t('termsLink')}</Link>
                </span>
              </label>

              <Button type="submit" size="lg" className="w-full" loading={loading}>{t('register')}</Button>
            </form>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>{t('verificationNote')}</span>
            </div>
          </CardBody>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-brand-600 font-medium hover:underline">{t('loginNow')}</Link>
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Car, Shield } from 'lucide-react';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      router.push(`/${locale}/auth/login?registered=true`);
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
            <Button variant="outline" size="lg" className="w-full">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {t('continueGoogle')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">{t('or')}</span></div>
            </div>

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
          <Link href={`/${locale}/auth/login`} className="text-brand-600 font-medium hover:underline">{t('loginNow')}</Link>
        </p>
      </div>
    </div>
  );
}

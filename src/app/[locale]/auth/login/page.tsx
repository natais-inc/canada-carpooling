'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Car } from 'lucide-react';

// Only honour relative, single-slash callback paths (no open redirects).
function safeCallback(raw: string | null): string | null {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
}
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get('callbackUrl'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t('invalidCredentials'));
      return;
    }
    router.push(callbackUrl || `/${locale}`);
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('loginSubtitle')}</p>
        </div>

        <Card>
          <CardBody className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label={t('email')}
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
              />
              <Input
                id="password"
                label={t('password')}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />

              <div className="flex justify-end">
                <Link href={`/${locale}/auth/forgot`} className="text-sm text-brand-600 hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {t('login')}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/auth/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-brand-600 font-medium hover:underline">
            {t('registerNow')}
          </Link>
        </p>
      </div>
    </div>
  );
}

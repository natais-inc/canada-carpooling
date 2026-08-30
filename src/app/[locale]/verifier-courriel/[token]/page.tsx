import VerifyEmail from './VerifyEmail';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage({ params }: { params: { locale: string; token: string } }) {
  return <VerifyEmail locale={params.locale} token={params.token} />;
}

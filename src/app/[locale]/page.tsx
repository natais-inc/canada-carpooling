import { useTranslations } from 'next-intl';
import {
  QrCode,
  Users,
  BarChart3,
  ParkingSquare,
  Leaf,
  HeartHandshake,
  Rocket,
  ArrowRight,
} from 'lucide-react';

export default function HomePage({ params }: { params: { locale: string } }) {
  const t = useTranslations('home');
  const locale = params.locale;

  const steps = [
    { icon: QrCode, title: t('step1Title'), desc: t('step1Desc') },
    { icon: Users, title: t('step2Title'), desc: t('step2Desc') },
    { icon: BarChart3, title: t('step3Title'), desc: t('step3Desc') },
  ];

  const benefits = [
    { icon: ParkingSquare, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: Leaf, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: HeartHandshake, title: t('benefit3Title'), desc: t('benefit3Desc') },
    { icon: Rocket, title: t('benefit4Title'), desc: t('benefit4Desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <span className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest text-brand-100 mb-5">
            {t('eyebrow')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            {t('title')}
          </h1>
          <p className="text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto mb-10">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`/${locale}/employers`}
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors"
            >
              {t('ctaEmployer')} <ArrowRight className="h-5 w-5 ml-2" />
            </a>
            <a
              href={`/${locale}/mon-covoiturage`}
              className="inline-flex items-center justify-center px-8 py-3 bg-brand-500/30 text-white font-semibold rounded-xl border-2 border-white/40 hover:bg-brand-500/50 transition-colors"
            >
              {t('ctaEmployee')}
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('howTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
                <span className="absolute -top-3 -left-3 flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white font-mono text-sm font-semibold">
                  {i + 1}
                </span>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 text-brand-600 rounded-xl mb-4">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why employers choose us */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('whyTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex-none inline-flex items-center justify-center w-12 h-12 bg-maple-50 text-maple-600 rounded-xl">
                  <b.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('ctaTitle')}</h2>
          <p className="text-lg text-gray-600 mb-8">{t('ctaSubtitle')}</p>
          <a
            href={`/${locale}/employer/inscription`}
            className="inline-flex items-center justify-center px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            {t('ctaPrimary')} <ArrowRight className="h-5 w-5 ml-2" />
          </a>
        </div>
      </section>
    </div>
  );
}

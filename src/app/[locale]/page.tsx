import { useTranslations } from 'next-intl';
import { Shield, CreditCard, MessageSquare, Star, MapPin, Users } from 'lucide-react';
import SearchForm from '@/components/trips/SearchForm';

export default function HomePage() {
  const t = useTranslations('home');

  const features = [
    { icon: Shield, title: t('features.verified.title'), desc: t('features.verified.description') },
    { icon: CreditCard, title: t('features.payment.title'), desc: t('features.payment.description') },
    { icon: MessageSquare, title: t('features.chat.title'), desc: t('features.chat.description') },
    { icon: Star, title: t('features.reviews.title'), desc: t('features.reviews.description') },
  ];

  const popularRoutes = [
    { from: 'Montréal', to: 'Québec', price: 25 },
    { from: 'Toronto', to: 'Ottawa', price: 30 },
    { from: 'Montréal', to: 'Toronto', price: 45 },
    { from: 'Calgary', to: 'Edmonton', price: 25 },
    { from: 'Vancouver', to: 'Whistler', price: 20 },
    { from: 'Ottawa', to: 'Montréal', price: 25 },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              {t('title')}
            </h1>
            <p className="text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('whyUs')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 text-brand-600 rounded-xl mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('popularRoutes')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map((route, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-brand-500" />
                  <div>
                    <p className="font-medium text-gray-900">{route.from} → {route.to}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-brand-600">{route.price} $</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-maple-50">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('ctaTitle')}</h2>
          <p className="text-lg text-gray-600 mb-8">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="inline-flex items-center justify-center px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">
              <Users className="h-5 w-5 mr-2" /> {t('ctaPassenger')}
            </a>
            <a href="#" className="inline-flex items-center justify-center px-8 py-3 bg-white text-brand-600 font-semibold rounded-xl border-2 border-brand-600 hover:bg-brand-50 transition-colors">
              {t('ctaDriver')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

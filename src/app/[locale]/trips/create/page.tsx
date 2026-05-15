'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, DollarSign, Users, Plus, Trash2, Car } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CANADIAN_CITIES, calculateServiceFee, calculateDriverPayout, formatPrice } from '@/lib/utils';

export default function CreateTripPage() {
  const t = useTranslations('trips');
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    departureCity: '',
    destinationCity: '',
    departureAddress: '',
    destinationAddress: '',
    departureDate: '',
    departureTime: '',
    estimatedArrival: '',
    price: 25,
    availableSeats: 3,
    description: '',
    allowPets: false,
    allowSmoking: false,
    allowMusic: true,
    maxLuggage: 2,
  });

  const [stops, setStops] = useState<{ city: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const addStop = () => setStops([...stops, { city: '', price: 0 }]);
  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: API call
    setTimeout(() => {
      router.push(`/${locale}/trips/search`);
    }, 1000);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('createTrip')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">{t('routeInfo')}</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('departure')}
                placeholder="Montréal"
                value={form.departureCity}
                onChange={e => update('departureCity', e.target.value)}
                icon={<MapPin className="h-4 w-4" />}
                required
                list="cities"
              />
              <Input
                label={t('destination')}
                placeholder="Québec"
                value={form.destinationCity}
                onChange={e => update('destinationCity', e.target.value)}
                icon={<MapPin className="h-4 w-4" />}
                required
                list="cities"
              />
            </div>
            <datalist id="cities">
              {CANADIAN_CITIES.map(c => <option key={c} value={c} />)}
            </datalist>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('departureAddress')}
                placeholder={t('addressPlaceholder')}
                value={form.departureAddress}
                onChange={e => update('departureAddress', e.target.value)}
              />
              <Input
                label={t('destinationAddress')}
                placeholder={t('addressPlaceholder')}
                value={form.destinationAddress}
                onChange={e => update('destinationAddress', e.target.value)}
              />
            </div>

            {/* Stops */}
            {stops.map((stop, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Input
                    label={`${t('stop')} ${i + 1}`}
                    value={stop.city}
                    onChange={e => {
                      const updated = [...stops];
                      updated[i].city = e.target.value;
                      setStops(updated);
                    }}
                    list="cities"
                  />
                </div>
                <div className="w-28">
                  <Input
                    label={t('price')}
                    type="number"
                    min={0}
                    value={stop.price}
                    onChange={e => {
                      const updated = [...stops];
                      updated[i].price = Number(e.target.value);
                      setStops(updated);
                    }}
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeStop(i)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addStop}>
              <Plus className="h-4 w-4 mr-1" /> {t('addStop')}
            </Button>
          </CardBody>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">{t('schedule')}</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t('date')}
                type="date"
                min={today}
                value={form.departureDate}
                onChange={e => update('departureDate', e.target.value)}
                icon={<Calendar className="h-4 w-4" />}
                required
              />
              <Input
                label={t('departureTimeLabel')}
                type="time"
                value={form.departureTime}
                onChange={e => update('departureTime', e.target.value)}
                icon={<Clock className="h-4 w-4" />}
                required
              />
              <Input
                label={t('estimatedArrival')}
                type="time"
                value={form.estimatedArrival}
                onChange={e => update('estimatedArrival', e.target.value)}
                icon={<Clock className="h-4 w-4" />}
              />
            </div>
          </CardBody>
        </Card>

        {/* Price & Seats */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">{t('priceAndSeats')}</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('pricePerSeat')}
                type="number"
                min={5}
                max={200}
                value={form.price}
                onChange={e => update('price', Number(e.target.value))}
                icon={<DollarSign className="h-4 w-4" />}
                required
              />
              <Input
                label={t('availableSeats')}
                type="number"
                min={1}
                max={8}
                value={form.availableSeats}
                onChange={e => update('availableSeats', Number(e.target.value))}
                icon={<Users className="h-4 w-4" />}
                required
              />
            </div>
            {form.price > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <p className="text-green-800">
                  {t('youWillReceive')}: <strong>{formatPrice(calculateDriverPayout(form.price))}</strong> {t('perBooking')}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  {t('serviceFeeExplain', { fee: '15%', processing: '3%' })}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">{t('preferences')}</h2></CardHeader>
          <CardBody className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allowPets} onChange={e => update('allowPets', e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4" />
              <span className="text-sm text-gray-700">{t('petsAllowed')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allowSmoking} onChange={e => update('allowSmoking', e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4" />
              <span className="text-sm text-gray-700">{t('smokingAllowed')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allowMusic} onChange={e => update('allowMusic', e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4" />
              <span className="text-sm text-gray-700">{t('musicAllowed')}</span>
            </label>
            <Input
              label={t('maxLuggage')}
              type="number"
              min={0}
              max={5}
              value={form.maxLuggage}
              onChange={e => update('maxLuggage', Number(e.target.value))}
              className="w-24"
            />
          </CardBody>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">{t('additionalInfo')}</h2></CardHeader>
          <CardBody>
            <textarea
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            />
          </CardBody>
        </Card>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <Car className="h-5 w-5 mr-2" /> {t('publishTrip')}
        </Button>
      </form>
    </div>
  );
}

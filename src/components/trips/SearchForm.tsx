'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, Search, ArrowRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CANADIAN_CITIES } from '@/lib/utils';

interface SearchFormProps {
  compact?: boolean;
  initialValues?: {
    departure?: string;
    destination?: string;
    date?: string;
    passengers?: number;
  };
}

export default function SearchForm({ compact, initialValues }: SearchFormProps) {
  const t = useTranslations('trips');
  const locale = useLocale();
  const router = useRouter();
  
  const [departure, setDeparture] = useState(initialValues?.departure || '');
  const [destination, setDestination] = useState(initialValues?.destination || '');
  const [date, setDate] = useState(initialValues?.date || '');
  const [passengers, setPassengers] = useState(initialValues?.passengers || 1);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const filteredDepartures = CANADIAN_CITIES.filter(c => c.toLowerCase().includes(departure.toLowerCase())).slice(0, 5);
  const filteredDestinations = CANADIAN_CITIES.filter(c => c.toLowerCase().includes(destination.toLowerCase())).slice(0, 5);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (departure) params.set('from', departure);
    if (destination) params.set('to', destination);
    if (date) params.set('date', date);
    if (passengers > 1) params.set('seats', String(passengers));
    router.push(`/${locale}/trips/search?${params.toString()}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSearch} className={compact ? 'flex flex-col sm:flex-row gap-3' : 'space-y-4'}>
      <div className={compact ? 'flex-1 flex flex-col sm:flex-row gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        {/* Departure */}
        <div className="relative flex-1">
          <Input
            placeholder={t('departure')}
            value={departure}
            onChange={e => { setDeparture(e.target.value); setShowDepartureSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowDepartureSuggestions(false), 200)}
            icon={<MapPin className="h-4 w-4" />}
          />
          {showDepartureSuggestions && departure && filteredDepartures.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredDepartures.map(city => (
                <li key={city} className="px-3 py-2 hover:bg-brand-50 cursor-pointer text-sm"
                  onMouseDown={() => { setDeparture(city); setShowDepartureSuggestions(false); }}>
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Destination */}
        <div className="relative flex-1">
          <Input
            placeholder={t('destination')}
            value={destination}
            onChange={e => { setDestination(e.target.value); setShowDestSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
            icon={<ArrowRight className="h-4 w-4" />}
          />
          {showDestSuggestions && destination && filteredDestinations.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredDestinations.map(city => (
                <li key={city} className="px-3 py-2 hover:bg-brand-50 cursor-pointer text-sm"
                  onMouseDown={() => { setDestination(city); setShowDestSuggestions(false); }}>
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date */}
        <div className="flex-1">
          <Input
            type="date"
            min={today}
            value={date}
            onChange={e => setDate(e.target.value)}
            icon={<Calendar className="h-4 w-4" />}
          />
        </div>

        {/* Passengers */}
        <div className={compact ? 'w-24' : 'flex-1'}>
          <Input
            type="number"
            min={1}
            max={8}
            value={passengers}
            onChange={e => setPassengers(Number(e.target.value))}
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      </div>

      <Button type="submit" size={compact ? 'md' : 'lg'} className={compact ? '' : 'w-full md:w-auto md:px-12'}>
        <Search className="h-4 w-4 mr-2" /> {t('searchButton')}
      </Button>
    </form>
  );
}

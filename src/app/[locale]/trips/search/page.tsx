'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import SearchForm from '@/components/trips/SearchForm';
import TripCard from '@/components/trips/TripCard';
import Button from '@/components/ui/Button';

// Mock data for MVP display
const MOCK_TRIPS = [
  {
    id: '1',
    originCity: 'Montréal, QC',
    destinationCity: 'Québec City, QC',
    departureDate: '2026-05-15',
    departureTime: '08:00',
    estimatedDuration: 150,
    pricePerSeat: 25,
    availableSeats: 3,
    allowPets: false,
    allowSmoking: false,
    allowMusic: true,
    driver: { firstName: 'Marie', lastName: 'Tremblay', averageRating: 4.8, totalTrips: 42, isVerified: true },
  },
  {
    id: '2',
    originCity: 'Montréal, QC',
    destinationCity: 'Québec City, QC',
    departureDate: '2026-05-15',
    departureTime: '10:00',
    estimatedDuration: 165,
    pricePerSeat: 22,
    availableSeats: 2,
    allowPets: true,
    allowSmoking: false,
    allowMusic: true,
    driver: { firstName: 'Jean', lastName: 'Lavoie', averageRating: 4.5, totalTrips: 18, isVerified: true },
  },
  {
    id: '3',
    originCity: 'Montréal, QC',
    destinationCity: 'Québec City, QC',
    departureDate: '2026-05-15',
    departureTime: '14:30',
    estimatedDuration: 150,
    pricePerSeat: 28,
    availableSeats: 1,
    allowPets: false,
    allowSmoking: false,
    allowMusic: false,
    driver: { firstName: 'Sophie', lastName: 'Martin', averageRating: 4.9, totalTrips: 87, isVerified: true },
  },
];

export default function SearchPage() {
  const t = useTranslations('trips');
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rating'>('time');
  const [showFilters, setShowFilters] = useState(false);

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';

  const trips = MOCK_TRIPS;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <SearchForm compact initialValues={{ departure: from, destination: to, date }} />
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {trips.length} {t('resultsFound')}
          {from && to && <span className="text-gray-500 font-normal"> &mdash; {from} &rarr; {to}</span>}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> {t('filters')}
          </Button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="time">{t('sortTime')}</option>
            <option value="price">{t('sortPrice')}</option>
            <option value="rating">{t('sortRating')}</option>
          </select>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
            {t('petsAllowed')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
            {t('verifiedOnly')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
            {t('instantBook')}
          </label>
          <div className="text-sm">
            <label className="block text-gray-600 mb-1">{t('maxPrice')}</label>
            <input type="range" min="10" max="100" className="w-full" />
          </div>
        </div>
      )}

      {/* Trip list */}
      <div className="space-y-3">
        {trips.length > 0 ? (
          trips.map(trip => <TripCard key={trip.id} trip={trip} />)
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{t('noResults')}</p>
            <p className="text-gray-400 text-sm mt-2">{t('tryDifferent')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

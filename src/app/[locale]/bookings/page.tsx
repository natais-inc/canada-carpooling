'use client';

import { useTranslations } from 'next-intl';
import { Calendar, MapPin, Users, Clock, Star, MessageSquare, ChevronRight, Car, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const mockBookings = [
  {
    id: 'b1',
    status: 'CONFIRMED',
    seatsBooked: 1,
    totalPrice: 25,
    serviceFee: 3.75,
    createdAt: '2026-05-10T14:00:00',
    trip: {
      id: 't1',
      originCity: 'Montréal',
      destinationCity: 'Québec',
      departureDate: '2026-05-15',
      departureTime: '08:00',
      estimatedDuration: 165,
      pricePerSeat: 25,
      driver: { id: 'd1', firstName: 'Luc', lastName: 'Gagnon', profileImage: null, averageRating: 4.9, verificationStatus: 'verified' },
    },
  },
  {
    id: 'b2',
    status: 'CONFIRMED',
    seatsBooked: 2,
    totalPrice: 60,
    serviceFee: 9,
    createdAt: '2026-05-08T10:00:00',
    trip: {
      id: 't2',
      originCity: 'Toronto',
      destinationCity: 'Ottawa',
      departureDate: '2026-05-20',
      departureTime: '10:00',
      estimatedDuration: 270,
      pricePerSeat: 30,
      driver: { id: 'd2', firstName: 'Sarah', lastName: 'Chen', profileImage: null, averageRating: 4.7, verificationStatus: 'verified' },
    },
  },
  {
    id: 'b3',
    status: 'COMPLETED',
    seatsBooked: 1,
    totalPrice: 45,
    serviceFee: 6.75,
    createdAt: '2026-04-20T09:00:00',
    trip: {
      id: 't3',
      originCity: 'Montréal',
      destinationCity: 'Toronto',
      departureDate: '2026-04-25',
      departureTime: '07:30',
      estimatedDuration: 330,
      pricePerSeat: 45,
      driver: { id: 'd3', firstName: 'Pierre', lastName: 'Lavoie', profileImage: null, averageRating: 4.6, verificationStatus: 'verified' },
    },
  },
  {
    id: 'b4',
    status: 'CANCELLED_BY_PASSENGER',
    seatsBooked: 1,
    totalPrice: 20,
    serviceFee: 3,
    createdAt: '2026-04-10T12:00:00',
    trip: {
      id: 't4',
      originCity: 'Québec',
      destinationCity: 'Montréal',
      departureDate: '2026-04-15',
      departureTime: '16:00',
      estimatedDuration: 165,
      pricePerSeat: 20,
      driver: { id: 'd4', firstName: 'Julie', lastName: 'Roy', profileImage: null, averageRating: 4.8, verificationStatus: 'verified' },
    },
  },
];

type TabType = 'upcoming' | 'past' | 'cancelled';

export default function BookingsPage() {
  const t = useTranslations('bookings');
  const tc = useTranslations('common');
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED_BY_PASSENGER':
      case 'CANCELLED_BY_DRIVER': return 'bg-red-100 text-red-700';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return t('confirmed');
      case 'PENDING': return t('pending');
      case 'COMPLETED': return t('completed');
      case 'CANCELLED_BY_PASSENGER':
      case 'CANCELLED_BY_DRIVER': return t('cancelledStatus');
      case 'NO_SHOW': return t('noShow');
      default: return status;
    }
  };

  const now = new Date();
  const filtered = mockBookings.filter((b) => {
    const tripDate = new Date(b.trip.departureDate);
    if (activeTab === 'upcoming') return ['CONFIRMED', 'PENDING'].includes(b.status) && tripDate >= now;
    if (activeTab === 'past') return b.status === 'COMPLETED' || (tripDate < now && ['CONFIRMED'].includes(b.status));
    return b.status.startsWith('CANCELLED') || b.status === 'NO_SHOW';
  });

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'upcoming', label: t('upcoming'), count: mockBookings.filter((b) => ['CONFIRMED', 'PENDING'].includes(b.status) && new Date(b.trip.departureDate) >= now).length },
    { key: 'past', label: t('past'), count: mockBookings.filter((b) => b.status === 'COMPLETED').length },
    { key: 'cancelled', label: t('cancelled'), count: mockBookings.filter((b) => b.status.startsWith('CANCELLED') || b.status === 'NO_SHOW').length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.key ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('noBookings')}</p>
          <Link
            href="/trips/search"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
          >
            <Search className="w-4 h-4" />
            {t('findRide')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                {/* Top: Route + Status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span>{booking.trip.originCity}</span>
                      <span className="text-gray-300">→</span>
                      <span>{booking.trip.destinationCity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(booking.trip.departureDate).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {booking.trip.departureTime}
                      </span>
                      {booking.trip.estimatedDuration && (
                        <span className="text-gray-400">· {formatDuration(booking.trip.estimatedDuration)}</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                {/* Middle: Driver + Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                      {getInitials(booking.trip.driver.firstName, booking.trip.driver.lastName)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{booking.trip.driver.firstName} {booking.trip.driver.lastName}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        {booking.trip.driver.averageRating}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{booking.totalPrice.toFixed(2)} $</p>
                    <p className="text-xs text-gray-400">
                      {booking.seatsBooked} {tc('seats').toLowerCase()} · {t('totalPaid')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3 justify-end">
                {booking.status === 'COMPLETED' && (
                  <button className="text-sm font-medium text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {t('leaveReview')}
                  </button>
                )}
                {['CONFIRMED', 'PENDING'].includes(booking.status) && (
                  <>
                    <button className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {t('contactDriver')}
                    </button>
                    <button className="text-sm font-medium text-red-500 hover:text-red-700">
                      {t('cancelBooking')}
                    </button>
                  </>
                )}
                <Link
                  href={`/trips/${booking.trip.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  {t('viewTrip')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useTranslations } from 'next-intl';
import { MapPin, Clock, Users, Calendar, PawPrint, Cigarette, Music, Luggage, MessageSquare, Shield, AlertTriangle } from 'lucide-react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { formatPrice, formatDate } from '@/lib/utils';

// Mock trip detail
const MOCK_TRIP = {
  id: '1',
  departureCity: 'Montréal',
  destinationCity: 'Québec',
  departureAddress: 'Station Berri-UQAM',
  destinationAddress: 'Place D\'Youville',
  departureDate: '2026-05-15',
  departureTime: '08:00',
  estimatedArrival: '10:30',
  price: 25,
  availableSeats: 3,
  totalSeats: 4,
  allowPets: false,
  allowSmoking: false,
  allowMusic: true,
  maxLuggage: 2,
  description: 'Départ ponctuel. Je pars du centre-ville et je peux déposer sur le chemin. Voiture confortable, Honda Civic 2023.',
  driver: {
    id: 'd1',
    name: 'Marie Tremblay',
    image: null,
    averageRating: 4.8,
    totalTrips: 42,
    isVerified: true,
    memberSince: '2024-03',
  },
  vehicle: { make: 'Honda', model: 'Civic', year: 2023, color: 'Bleu' },
  stops: [
    { city: 'Trois-Rivières', price: 15 },
  ],
  reviews: [
    { author: 'Pierre D.', rating: 5, comment: 'Excellente conductrice, ponctuelle et sympathique!', date: '2026-04-20' },
    { author: 'Sarah L.', rating: 4, comment: 'Bon trajet, voiture propre.', date: '2026-04-10' },
  ],
};

export default function TripDetailPage() {
  const t = useTranslations('trips');
  const trip = MOCK_TRIP;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route header */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-brand-500 border-2 border-brand-200" />
                      <div className="w-0.5 h-16 bg-gray-200 my-1" />
                      {trip.stops.length > 0 && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <div className="w-0.5 h-16 bg-gray-200 my-1" />
                        </>
                      )}
                      <div className="w-3 h-3 rounded-full bg-maple-500 border-2 border-maple-200" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="font-semibold text-lg text-gray-900">{trip.departureCity}</p>
                        <p className="text-sm text-gray-500">{trip.departureAddress}</p>
                        <p className="text-sm font-medium text-brand-600">{trip.departureTime}</p>
                      </div>
                      {trip.stops.map((stop, i) => (
                        <div key={i} className="py-2">
                          <p className="text-sm font-medium text-gray-700">{stop.city}</p>
                          <p className="text-xs text-gray-500">{formatPrice(stop.price)}</p>
                        </div>
                      ))}
                      <div>
                        <p className="font-semibold text-lg text-gray-900">{trip.destinationCity}</p>
                        <p className="text-sm text-gray-500">{trip.destinationAddress}</p>
                        <p className="text-sm font-medium text-brand-600">{trip.estimatedArrival}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info row */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(trip.departureDate, 'fr')}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> ~2h30</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {trip.availableSeats}/{trip.totalSeats} {t('seatsAvailable')}</span>
              </div>
            </CardBody>
          </Card>

          {/* Description */}
          {trip.description && (
            <Card>
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-2">{t('tripDescription')}</h3>
                <p className="text-gray-600">{trip.description}</p>
              </CardBody>
            </Card>
          )}

          {/* Preferences */}
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-3">{t('preferences')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`flex items-center gap-2 text-sm ${trip.allowPets ? 'text-green-700' : 'text-gray-400'}`}>
                  <PawPrint className="h-4 w-4" /> {trip.allowPets ? t('petsAllowed') : t('noPets')}
                </div>
                <div className={`flex items-center gap-2 text-sm ${trip.allowSmoking ? 'text-green-700' : 'text-gray-400'}`}>
                  <Cigarette className="h-4 w-4" /> {trip.allowSmoking ? t('smokingAllowed') : t('noSmoking')}
                </div>
                <div className={`flex items-center gap-2 text-sm ${trip.allowMusic ? 'text-green-700' : 'text-gray-400'}`}>
                  <Music className="h-4 w-4" /> {trip.allowMusic ? t('musicAllowed') : t('noMusic')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Luggage className="h-4 w-4" /> {t('maxLuggage', { count: trip.maxLuggage })}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vehicle */}
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-2">{t('vehicle')}</h3>
              <p className="text-gray-600">
                {trip.vehicle.color} {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.year}
              </p>
            </CardBody>
          </Card>

          {/* Reviews */}
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-4">{t('driverReviews')}</h3>
              <div className="space-y-4">
                {trip.reviews.map((review, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{review.author}</span>
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - Booking */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardBody className="space-y-4">
              <div className="text-center">
                <span className="text-3xl font-bold text-brand-600">{formatPrice(trip.price)}</span>
                <p className="text-sm text-gray-500">{t('perSeat')}</p>
              </div>

              {/* Driver */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar name={trip.driver.name} src={trip.driver.image} size="lg" verified={trip.driver.isVerified} />
                <div>
                  <p className="font-semibold text-gray-900">{trip.driver.name}</p>
                  <div className="flex items-center gap-1">
                    <StarRating rating={trip.driver.averageRating} size="sm" />
                    <span className="text-xs text-gray-500">({trip.driver.totalTrips} trajets)</span>
                  </div>
                  {trip.driver.isVerified && (
                    <Badge variant="success" className="mt-1">
                      <Shield className="h-3 w-3 mr-1" /> {t('verified')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Seats selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('numberOfSeats')}</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500">
                  {Array.from({ length: trip.availableSeats }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? t('seat') : t('seats')}</option>
                  ))}
                </select>
              </div>

              {/* Total */}
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-gray-600">1 × {formatPrice(trip.price)}</span>
                <span className="font-semibold">{formatPrice(trip.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('serviceFee')}</span>
                <span className="font-semibold">{formatPrice(trip.price * 0.15)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-3">
                <span>{t('total')}</span>
                <span className="text-brand-600">{formatPrice(trip.price * 1.15)}</span>
              </div>

              <Button size="lg" className="w-full">{t('bookNow')}</Button>

              <Button variant="outline" size="md" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" /> {t('contactDriver')}
              </Button>

              {/* Cancellation policy */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700 mb-1">{t('cancellationPolicy')}</p>
                <p>• {t('cancellationFree')}</p>
                <p>• {t('cancellation50')}</p>
                <p>• {t('cancellation100')}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

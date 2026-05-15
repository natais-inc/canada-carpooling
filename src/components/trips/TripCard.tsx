'use client';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Clock, Users, MapPin, PawPrint, Cigarette, Music } from 'lucide-react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { formatPrice, formatDate, formatTime } from '@/lib/utils';

interface TripCardProps {
  trip: {
    id: string;
    originCity: string;
    destinationCity: string;
    departureDate: string;
    departureTime: string;
    estimatedDuration?: number; // minutes
    pricePerSeat: number;
    availableSeats: number;
    allowPets: boolean;
    allowSmoking: boolean;
    allowMusic: boolean;
    driver: {
      firstName: string;
      lastName: string;
      profileImage?: string;
      averageRating?: number;
      totalTrips?: number;
      isVerified?: boolean;
    };
  };
}

export default function TripCard({ trip }: TripCardProps) {
  const t = useTranslations('trips');
  const locale = useLocale();

  return (
    <Link href={`/${locale}/trips/${trip.id}`}>
      <Card hover className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Route info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="font-semibold text-gray-900">{trip.originCity}</span>
              </div>
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-maple-500" />
                <span className="font-semibold text-gray-900">{trip.destinationCity}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {trip.departureTime}
                {trip.estimatedDuration && ` (${Math.floor(trip.estimatedDuration / 60)}h${trip.estimatedDuration % 60 ? String(trip.estimatedDuration % 60).padStart(2, '0') : ''})`}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {trip.availableSeats} {t('seatsAvailable')}
              </span>
            </div>

            {/* Preferences */}
            <div className="flex items-center gap-2 mt-2">
              {trip.allowPets && <PawPrint className="h-3.5 w-3.5 text-green-600" />}
              {trip.allowMusic && <Music className="h-3.5 w-3.5 text-blue-600" />}
              {trip.allowSmoking && <Cigarette className="h-3.5 w-3.5 text-orange-600" />}
            </div>
          </div>

          {/* Driver info */}
          <div className="flex items-center gap-3 sm:border-l sm:pl-4 sm:border-gray-100">
            <Avatar
              name={`${trip.driver.firstName} ${trip.driver.lastName}`}
              src={trip.driver.profileImage}
              size="md"
              verified={trip.driver.isVerified}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{trip.driver.firstName} {trip.driver.lastName}</p>
              {trip.driver.averageRating && (
                <div className="flex items-center gap-1">
                  <StarRating rating={trip.driver.averageRating} size="sm" />
                  <span className="text-xs text-gray-500">({trip.driver.totalTrips})</span>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="text-2xl font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</span>
            <p className="text-xs text-gray-500">{t('perSeat')}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

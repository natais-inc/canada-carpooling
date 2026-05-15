'use client';

import { useTranslations } from 'next-intl';
import { 
  Shield, ShieldCheck, Star, Car, MapPin, Calendar, 
  Edit, Camera, Phone, Mail, Clock, TrendingUp, 
  CheckCircle, XCircle, ChevronRight 
} from 'lucide-react';
import { useState } from 'react';

// Mock user data
const mockUser = {
  id: '1',
  firstName: 'Marie',
  lastName: 'Tremblay',
  email: 'marie@example.com',
  phone: '+1 514-555-0123',
  phoneVerified: true,
  profileImage: null,
  bio: 'Conductrice régulière Montréal-Québec. J\'adore les road trips et les bonnes conversations!',
  preferredLanguage: 'fr',
  verificationStatus: 'verified',
  idVerified: true,
  licenseVerified: true,
  averageRating: 4.8,
  totalTripsAsDriver: 47,
  totalTripsAsPassenger: 12,
  responseRate: 98,
  cancellationRate: 2,
  createdAt: '2024-03-15',
  vehicles: [
    { id: '1', make: 'Toyota', model: 'Corolla', year: 2022, color: 'Blanc', licensePlate: 'ABC 1234', seats: 4 },
  ],
};

const mockReviews = [
  {
    id: '1',
    author: { firstName: 'Jean', lastName: 'D.', profileImage: null },
    rating: 5,
    comment: 'Excellente conductrice, très ponctuelle et agréable. Véhicule propre et confortable.',
    trip: { originCity: 'Montréal', destinationCity: 'Québec' },
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    author: { firstName: 'Sarah', lastName: 'M.', profileImage: null },
    rating: 4,
    comment: 'Bon trajet, bonne communication. Recommandé!',
    trip: { originCity: 'Montréal', destinationCity: 'Ottawa' },
    createdAt: '2024-11-15',
  },
  {
    id: '3',
    author: { firstName: 'Pierre', lastName: 'L.', profileImage: null },
    rating: 5,
    comment: 'Toujours un plaisir de voyager avec Marie. Très fiable.',
    trip: { originCity: 'Québec', destinationCity: 'Montréal' },
    createdAt: '2024-10-28',
  },
];

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tr = useTranslations('reviews');
  const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'vehicles'>('info');

  const user = mockUser;

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const VerificationBadge = ({ verified }: { verified: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
      {verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {verified ? t('verified') : t('notVerified')}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-3xl font-bold">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user.firstName, user.lastName)
              )}
            </div>
            {user.idVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
            <button className="absolute bottom-0 left-0 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {t('memberSince')} {new Date(user.createdAt).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Edit className="w-4 h-4" />
                {t('editProfile')}
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-1 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xl font-bold text-gray-900">{user.averageRating}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('rating')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-bold text-gray-900">{user.totalTripsAsDriver}</p>
                <p className="text-xs text-gray-500 mt-1">{t('tripsAsDriver')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-bold text-gray-900">{user.responseRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{t('responseRate')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-bold text-gray-900">{user.cancellationRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{t('cancellationRate')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-gray-100 rounded-xl p-1">
        {(['info', 'reviews', 'vehicles'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'info' ? t('personalInfo') : tab === 'reviews' ? t('myReviews') : t('vehicles')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Personal Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Bio */}
            {user.bio && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{t('bio')}</h3>
                <p className="text-gray-600">{user.bio}</p>
              </div>
            )}

            {/* Contact */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('personalInfo')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{user.phone}</span>
                  {user.phoneVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('verified')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('verification')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{t('idVerified')}</span>
                  </div>
                  <VerificationBadge verified={user.idVerified} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{t('licenseVerified')}</span>
                  </div>
                  <VerificationBadge verified={user.licenseVerified} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {mockReviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{tr('noReviews')}</p>
              </div>
            ) : (
              mockReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                        {getInitials(review.author.firstName, review.author.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.author.firstName} {review.author.lastName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {review.trip.originCity} → {review.trip.destinationCity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-3">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('fr-CA')}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {user.vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Car className="w-7 h-7 text-brand-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</p>
                    <p className="text-sm text-gray-500">{v.color} · {v.licensePlate} · {v.seats} {tc('seats').toLowerCase()}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors font-medium">
              + {t('addVehicle')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { User, Trip, Booking, Review, Message, Vehicle, TripStop } from '@prisma/client';

export type SafeUser = Omit<User, 'password' | 'stripeAccountId' | 'stripeCustomerId'> & {
  vehicles?: Vehicle[];
  averageRating?: number;
};

export type TripWithDriver = Trip & {
  driver: SafeUser;
  stops: TripStop[];
  bookings?: BookingWithPassenger[];
  _count?: { bookings: number };
};

export type BookingWithPassenger = Booking & {
  passenger: SafeUser;
};

export type BookingWithTrip = Booking & {
  trip: TripWithDriver;
};

export type ReviewWithAuthor = Review & {
  reviewer: SafeUser;
};

export type MessageWithSender = Message & {
  sender: SafeUser;
};

export type SearchFilters = {
  departure: string;
  destination: string;
  date: string;
  passengers?: number;
};

export type CreateTripInput = {
  departureCity: string;
  destinationCity: string;
  departureAddress?: string;
  destinationAddress?: string;
  departureDate: string;
  departureTime: string;
  estimatedArrival?: string;
  price: number;
  availableSeats: number;
  vehicleId?: string;
  description?: string;
  allowPets: boolean;
  allowSmoking: boolean;
  allowMusic: boolean;
  maxLuggage: number;
  stops?: { city: string; price?: number; order: number }[];
};

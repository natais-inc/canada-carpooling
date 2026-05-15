// Use inline type definitions instead of importing from @prisma/client
// which requires prisma generate to have run first.
// These match the Prisma schema exactly.

type User = {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  image: string | null;
  phone: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  governmentIdVerified: boolean;
  phoneVerified: boolean;
  emailVerified: Date | null;
  identityProvider: string | null;
  stripeAccountId: string | null;
  stripeCustomerId: string | null;
  averageRatingAsDriver: number | null;
  averageRatingAsPassenger: number | null;
  totalTripsAsDriver: number;
  totalTripsAsPassenger: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

type Trip = {
  id: string;
  driverId: string;
  departureCity: string;
  destinationCity: string;
  departureAddress: string | null;
  destinationAddress: string | null;
  departureDate: Date;
  departureTime: string;
  estimatedArrival: string | null;
  price: number;
  availableSeats: number;
  status: string;
  description: string | null;
  allowPets: boolean;
  allowSmoking: boolean;
  allowMusic: boolean;
  maxLuggage: number;
  vehicleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

type Booking = {
  id: string;
  tripId: string;
  passengerId: string;
  seats: number;
  status: string;
  totalPrice: number;
  platformFee: number;
  driverPayout: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

type Review = {
  id: string;
  tripId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  [key: string]: any;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  tripId: string | null;
  content: string;
  read: boolean;
  createdAt: Date;
  [key: string]: any;
};

type Vehicle = {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  [key: string]: any;
};

type TripStop = {
  id: string;
  tripId: string;
  city: string;
  price: number | null;
  order: number;
  [key: string]: any;
};

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

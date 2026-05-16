'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Loader2, CheckCircle, XCircle, Banknote, HandCoins, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface BookingConfirmationProps {
  tripId: string;
  seats: number;
  pricePerSeat: number;
  driverName: string;
  route: string;
  departureDate: string;
  provinceCode?: string;
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

type BookingState = 'idle' | 'creating_booking' | 'paying' | 'success' | 'error';

/**
 * PaymentCheckout — Hybrid payment model
 * 1. Creates booking (PENDING) with the $1+taxes fee stored
 * 2. Creates Stripe PaymentIntent for the $1+taxes platform fee
 * 3. Collects payment via Stripe Elements
 * 4. Trip price is paid directly passenger → driver
 */
export default function PaymentCheckout({
  tripId,
  seats,
  pricePerSeat,
  driverName,
  route,
  departureDate,
  provinceCode,
  onSuccess,
  onCancel,
}: BookingConfirmationProps) {
  const t = useTranslations('booking');
  const [state, setState] = useState<BookingState>('idle');
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    base: number;
    tax: number;
    taxName: string;
    total: number;
  } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const tripPrice = Math.round(pricePerSeat * seats * 100) / 100;

  // Step 1: Create booking
  const handleBooking = async () => {
    setState('creating_booking');
    setError('');

    try {
      // Create the booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, seats, provinceCode }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || 'Booking failed');

      setBookingId(bookingData.booking.id);

      // Create PaymentIntent for $1+taxes platform fee
      const piRes = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          tripId,
          provinceCode,
        }),
      });

      const piData = await piRes.json();
      if (!piRes.ok) {
        // Booking created but Stripe unavailable — still success (fee pending)
        if (piRes.status === 503) {
          setFeeBreakdown(bookingData.priceBreakdown?.platformFee ? {
            base: bookingData.priceBreakdown.platformFee.baseFee,
            tax: bookingData.priceBreakdown.platformFee.taxAmount,
            taxName: bookingData.priceBreakdown.platformFee.taxName,
            total: bookingData.priceBreakdown.platformFee.totalFee,
          } : null);
          setState('success');
          setTimeout(() => onSuccess?.(bookingData.booking.id), 2000);
          return;
        }
        throw new Error(piData.error || 'Payment setup failed');
      }

      setClientSecret(piData.clientSecret);
      setFeeBreakdown(piData.fee);
      setState('paying');
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Booking failed');
    }
  };

  // Step 2: Confirm payment (using Stripe.js confirmPayment)
  const handlePayment = async () => {
    if (!clientSecret || !bookingId) return;
    setState('creating_booking'); // reuse spinner

    try {
      // Dynamically load Stripe.js
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!stripePublishableKey) {
        // Stripe not configured — booking still valid, payment pending
        setState('success');
        setTimeout(() => onSuccess?.(bookingId), 2000);
        return;
      }

      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) throw new Error('Stripe failed to load');

      // Use confirmCardPayment with a simple card redirect
      // For production, you'd embed Stripe Elements (CardElement) here
      // For now, use redirect-based payment (Payment Sheet / Checkout)
      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/${bookingId}?payment=success`,
        },
      });

      if (stripeError) {
        // Payment failed but booking exists
        setError(stripeError.message || 'Payment failed');
        setState('paying');
      }
      // If no error, user was redirected
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Payment failed');
    }
  };

  // Success state
  if (state === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{t('requestSent')}</h3>
        <p className="text-gray-600 mt-2">{t('pendingDriverApproval')}</p>
        <p className="text-sm text-gray-500 mt-3">{t('directPaymentReminder')}</p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{t('bookingFailed')}</h3>
        <p className="text-red-600 mt-2 text-sm">{error}</p>
        <button
          onClick={() => setState('idle')}
          className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  // Payment step — Stripe Elements would go here
  if (state === 'paying' && clientSecret && feeBreakdown) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">{t('platformFeeTitle')}</h3>
          <p className="text-sm text-gray-600">{t('platformFeeDesc')}</p>
        </div>

        <div className="p-6 border-b border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('serviceFee')}</span>
            <span className="text-gray-900">{formatPrice(feeBreakdown.base)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{feeBreakdown.taxName}</span>
            <span className="text-gray-900">{formatPrice(feeBreakdown.tax)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>{t('totalServiceFee')}</span>
            <span className="text-brand-600">{formatPrice(feeBreakdown.total)}</span>
          </div>
        </div>

        {/* Stripe Payment Element placeholder — in production, embed <PaymentElement> here */}
        <div className="p-6 space-y-3">
          <button
            onClick={handlePayment}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            {t('payServiceFee')} — {formatPrice(feeBreakdown.total)}
          </button>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <p className="text-xs text-gray-500 text-center">{t('stripeSecure')}</p>
        </div>
      </div>
    );
  }

  // Default: booking confirmation
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Trip summary */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">{t('bookingSummary')}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-900">{route}</p>
          <p>{departureDate}</p>
          <p>{driverName}</p>
        </div>
      </div>

      {/* Price breakdown — trip price + platform fee */}
      <div className="p-6 border-b border-gray-100 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {formatPrice(pricePerSeat)} x {seats} {seats > 1 ? 'places' : 'place'}
          </span>
          <span className="text-gray-900">{formatPrice(tripPrice)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{t('serviceFeeLabel')}</span>
          <span>1,99 $ ({t('taxesIncluded')})</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t pt-3">
          <span>{t('totalToPay')}</span>
          <span className="text-brand-600">{formatPrice(tripPrice)} + 1,99 $</span>
        </div>
      </div>

      {/* Hybrid payment info */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start gap-3">
          <HandCoins className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">{t('hybridPaymentTitle')}</p>
            <p className="mt-1 text-blue-700">{t('hybridPaymentDesc')}</p>
          </div>
        </div>
      </div>

      {/* Platform fee notice */}
      <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-indigo-800">
            <p className="font-medium">{t('platformFeeNotice')}</p>
            <p className="mt-1 text-indigo-700">{t('platformFeeNoticeDesc')}</p>
          </div>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="px-6 py-4 bg-gray-50 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">{t('cancellationPolicy')}</p>
        <p>• {t('freeCancellationWithRefund')}</p>
        <p>• {t('lateCancellationNoRefund')}</p>
        <p>• {t('noShowPolicy')}</p>
      </div>

      {/* Action buttons */}
      <div className="p-6 space-y-3">
        <button
          onClick={handleBooking}
          disabled={state === 'creating_booking'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'creating_booking' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <Banknote className="w-5 h-5" />
              {t('confirmBooking')}
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={state === 'creating_booking'}
            className="w-full px-6 py-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            {t('cancel')}
          </button>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>{t('verifiedUsers')}</span>
        </div>
      </div>
    </div>
  );
}

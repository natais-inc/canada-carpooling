'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface PaymentCheckoutProps {
  tripId: string;
  seats: number;
  pricePerSeat: number;
  driverName: string;
  route: string;
  departureDate: string;
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

type CheckoutState = 'idle' | 'processing' | 'success' | 'error';

export default function PaymentCheckout({
  tripId,
  seats,
  pricePerSeat,
  driverName,
  route,
  departureDate,
  onSuccess,
  onCancel,
}: PaymentCheckoutProps) {
  const t = useTranslations('payment');
  const tBooking = useTranslations('booking');
  const [state, setState] = useState<CheckoutState>('idle');
  const [error, setError] = useState('');

  const subtotal = pricePerSeat * seats;
  const serviceFee = Math.round(subtotal * 0.15 * 100) / 100;
  const total = subtotal + serviceFee;

  const handlePayment = async () => {
    setState('processing');
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, seats }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      if (data.clientSecret) {
        // In production, this would redirect to Stripe Checkout
        // or use Stripe Elements to collect card details
        // For MVP, we simulate a successful payment
        setState('success');
        setTimeout(() => {
          onSuccess?.(data.booking.id);
        }, 2000);
      } else {
        // No Stripe account configured (dev mode)
        setState('success');
        setTimeout(() => {
          onSuccess?.(data.booking.id);
        }, 2000);
      }
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Payment failed');
    }
  };

  if (state === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{t('success')}</h3>
        <p className="text-gray-600 mt-2">{tBooking('confirmed')}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{t('failed')}</h3>
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Trip summary */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">{t('summary')}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-900">{route}</p>
          <p>{departureDate}</p>
          <p>{driverName}</p>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="p-6 border-b border-gray-100 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {formatPrice(pricePerSeat)} × {seats} {seats > 1 ? 'places' : 'place'}
          </span>
          <span className="text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('serviceFee')}</span>
          <span className="text-gray-900">{formatPrice(serviceFee)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t pt-3">
          <span>{t('total')}</span>
          <span className="text-brand-600">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="px-6 py-4 bg-gray-50 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">{tBooking('cancellationPolicy')}</p>
        <p>• {tBooking('freeCancellation')}</p>
        <p>• {tBooking('lateCancellation')}</p>
        <p>• {tBooking('noShowPolicy')}</p>
      </div>

      {/* Action buttons */}
      <div className="p-6 space-y-3">
        <button
          onClick={handlePayment}
          disabled={state === 'processing'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {t('pay')} — {formatPrice(total)}
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={state === 'processing'}
            className="w-full px-6 py-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            {tBooking('cancellationPolicy')}
          </button>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>{t('securePayment')}</span>
        </div>
      </div>
    </div>
  );
}

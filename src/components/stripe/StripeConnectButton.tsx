'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type ConnectStatus = {
  connected: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
};

export default function StripeConnectButton() {
  const t = useTranslations('stripe');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/stripe/connect');
      const data = await res.json();
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Check status on mount
  useState(() => {
    checkStatus();
  });

  const isActive = status?.chargesEnabled && status?.payoutsEnabled;
  const isPending = status?.connected && !isActive;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${isActive ? 'bg-green-100' : 'bg-brand-100'}`}>
          <CreditCard className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-brand-600'}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{t('connectTitle')}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('connectDesc')}</p>

          {isActive && (
            <div className="flex items-center gap-2 mt-3 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('connectActive')}</span>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 mt-3 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('connectPending')}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          {/* Fee breakdown */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>{t('platformFee')}</span>
              <span>-15%</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t('processingFee')}</span>
              <span>~3%</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900 border-t pt-1 mt-1">
              <span>{t('youReceive')}</span>
              <span>~82%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('payoutSchedule')}</p>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {isActive ? t('connectDashboard') : isPending ? t('connectPending') : t('connectButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

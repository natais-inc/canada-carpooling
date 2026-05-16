'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck, FileCheck, Car, FileText, CheckCircle, AlertCircle,
  Loader2, CreditCard, ExternalLink, HandCoins, DollarSign,
} from 'lucide-react';

type VerificationItem = {
  key: string;
  label: string;
  verified: boolean;
  icon: React.ReactNode;
};

type StripeStatus = {
  hasAccount: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  onboardingUrl?: string;
  dashboardUrl?: string;
};

/**
 * StripeConnectButton — Driver verification + Stripe Connect onboarding
 * 1. Shows verification checklist (identity, license, vehicle, insurance)
 * 2. After all verified → shows Stripe Connect setup for $1+taxes platform fee
 * 3. Shows Stripe status (pending/active) and dashboard link
 */
export default function StripeConnectButton() {
  const t = useTranslations('verification');
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch verification status and Stripe Connect status in parallel
        const [verRes, stripeRes] = await Promise.all([
          fetch('/api/verification/status'),
          fetch('/api/stripe/connect'),
        ]);

        if (verRes.ok) {
          setVerificationData(await verRes.json());
        }
        if (stripeRes.ok) {
          setStripeStatus(await stripeRes.json());
        }
      } catch {
        // Silently fail — will show default state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const items: VerificationItem[] = [
    {
      key: 'identity',
      label: t('identityVerification'),
      verified: verificationData?.idVerified || false,
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      key: 'license',
      label: t('licenseVerification'),
      verified: verificationData?.licenseVerified || false,
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      key: 'vehicle',
      label: t('vehicleRegistration'),
      verified: verificationData?.vehicleRegistrationVerified || false,
      icon: <Car className="w-4 h-4" />,
    },
    {
      key: 'insurance',
      label: t('insuranceVerification'),
      verified: verificationData?.insuranceVerified || false,
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const allVerified = items.every((item) => item.verified);
  const verifiedCount = items.filter((item) => item.verified).length;

  // Stripe Connect onboarding
  const handleStripeSetup = async () => {
    setStripeLoading(true);
    setStripeError('');
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stripe setup failed');

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Refresh Stripe status
        const statusRes = await fetch('/api/stripe/connect');
        if (statusRes.ok) setStripeStatus(await statusRes.json());
      }
    } catch (err: any) {
      setStripeError(err.message || 'Stripe setup failed');
    } finally {
      setStripeLoading(false);
    }
  };

  // Open Stripe Express dashboard
  const handleDashboard = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch('/api/stripe/connect?action=dashboard');
      const data = await res.json();
      if (data.dashboardUrl) {
        window.open(data.dashboardUrl, '_blank');
      }
    } catch {
      // Silently fail
    } finally {
      setStripeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const stripeActive = stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled;
  const stripePending = stripeStatus?.hasAccount && !stripeActive;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section 1: Verification */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${allVerified ? 'bg-green-100' : 'bg-amber-100'}`}>
            <ShieldCheck className={`w-6 h-6 ${allVerified ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{t('driverVerificationTitle')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('driverVerificationDesc')}</p>

            {allVerified && (
              <div className="flex items-center gap-2 mt-3 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('fullyVerified')}</span>
              </div>
            )}

            {!allVerified && (
              <div className="flex items-center gap-2 mt-3 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t('verificationProgress', { done: verifiedCount, total: items.length })}
                </span>
              </div>
            )}

            {/* Verification checklist */}
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                    item.verified ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.verified ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">{t('pending')}</span>
                  )}
                </div>
              ))}
            </div>

            {!allVerified && (
              <a
                href="/verification"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('completeVerification')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Stripe Connect (shown after all verifications) */}
      {allVerified && (
        <div className="border-t border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${stripeActive ? 'bg-green-100' : stripePending ? 'bg-amber-100' : 'bg-indigo-100'}`}>
              <CreditCard className={`w-6 h-6 ${stripeActive ? 'text-green-600' : stripePending ? 'text-amber-600' : 'text-indigo-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{t('stripeConnectTitle')}</h3>
              <p className="text-sm text-gray-600 mt-1">{t('stripeConnectDesc')}</p>

              {/* Stripe status */}
              {stripeActive && (
                <>
                  <div className="flex items-center gap-2 mt-3 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('stripeActive')}</span>
                  </div>
                  <button
                    onClick={handleDashboard}
                    disabled={stripeLoading}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {stripeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {t('viewStripeDashboard')}
                  </button>
                </>
              )}

              {stripePending && (
                <>
                  <div className="flex items-center gap-2 mt-3 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('stripePending')}</span>
                  </div>
                  <button
                    onClick={handleStripeSetup}
                    disabled={stripeLoading}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {stripeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {t('completeStripeSetup')}
                  </button>
                </>
              )}

              {!stripeStatus?.hasAccount && (
                <button
                  onClick={handleStripeSetup}
                  disabled={stripeLoading}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {t('setupStripe')}
                </button>
              )}

              {stripeError && (
                <p className="mt-2 text-sm text-red-600">{stripeError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Hybrid payment model info */}
      <div className="border-t border-gray-100 px-6 py-4 bg-blue-50">
        <div className="flex items-start gap-3">
          <HandCoins className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">{t('hybridPaymentTitle')}</p>
            <p className="text-xs text-blue-700 mt-1">{t('hybridPaymentDesc')}</p>
          </div>
        </div>
      </div>

      {/* Platform fee notice */}
      <div className="border-t border-blue-100 px-6 py-3 bg-indigo-50">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-indigo-800">
            <p className="font-medium">{t('driverFeeNotice')}</p>
            <p className="text-xs text-indigo-700 mt-1">{t('driverFeeNoticeDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

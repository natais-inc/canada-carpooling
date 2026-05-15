'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, CheckCircle, AlertCircle, XCircle, Loader2, Camera, FileText, CreditCard } from 'lucide-react';

type VerificationState = {
  idVerified: boolean;
  licenseVerified: boolean;
  selfieVerified: boolean;
  verificationStatus: string;
};

export default function VerificationButton() {
  const t = useTranslations('verification');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<VerificationState | null>(null);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      setChecking(true);
      const res = await fetch('/api/verification');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Silently handle
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleStartVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verification', { method: 'POST' });
      const data = await res.json();

      if (data.verificationUrl) {
        window.open(data.verificationUrl, '_blank', 'width=600,height=800');
        // Poll for status updates after opening Veriff
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch('/api/verification');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setStatus(statusData);
            if (statusData.verificationStatus === 'verified' || statusData.verificationStatus === 'rejected') {
              clearInterval(pollInterval);
            }
          }
        }, 5000);
        // Stop polling after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 600000);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const isFullyVerified = status?.idVerified && status?.licenseVerified && status?.selfieVerified;
  const isPending = status?.verificationStatus === 'pending';
  const isRejected = status?.verificationStatus === 'rejected';

  const getStatusIcon = (verified: boolean) => {
    if (verified) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isPending) return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
    if (isRejected) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  if (checking) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${
          isFullyVerified ? 'bg-green-100' : isPending ? 'bg-amber-100' : isRejected ? 'bg-red-100' : 'bg-brand-100'
        }`}>
          <Shield className={`w-6 h-6 ${
            isFullyVerified ? 'text-green-600' : isPending ? 'text-amber-600' : isRejected ? 'text-red-600' : 'text-brand-600'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{t('title')}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('description')}</p>

          {/* Verification checklist */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              {getStatusIcon(status?.idVerified ?? false)}
              <FileText className="w-4 h-4 text-gray-500" />
              <span className={`text-sm ${status?.idVerified ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                {t('idVerification')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(status?.licenseVerified ?? false)}
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className={`text-sm ${status?.licenseVerified ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                {t('licenseVerification')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(status?.selfieVerified ?? false)}
              <Camera className="w-4 h-4 text-gray-500" />
              <span className={`text-sm ${status?.selfieVerified ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                {t('selfieVerification')}
              </span>
            </div>
          </div>

          {/* Status messages */}
          {isFullyVerified && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{t('fullyVerified')}</span>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 rounded-lg text-amber-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">{t('pendingReview')}</span>
            </div>
          )}

          {isRejected && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-700">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{t('rejected')}</span>
              </div>
              <p className="text-xs mt-1 ml-7">{t('rejectedHelp')}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          {/* Info box */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">{t('whatYouNeed')}</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>{t('needPassportOrId')}</li>
              <li>{t('needDriverLicense')}</li>
              <li>{t('needSelfie')}</li>
              <li>{t('needGoodLighting')}</li>
            </ul>
          </div>

          {!isFullyVerified && (
            <button
              onClick={handleStartVerification}
              disabled={loading || isPending}
              className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isPending
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : isRejected
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isPending ? t('verificationInProgress') : isRejected ? t('retryVerification') : t('startVerification')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

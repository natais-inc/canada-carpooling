'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ConsentStatus {
  valid: boolean;
  needsRenewal: boolean;
  missingConsents: string[];
  currentVersion: string;
}

export default function PrivacySettings() {
  const t = useTranslations('consent');
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConsentStatus();
  }, []);

  const fetchConsentStatus = async () => {
    try {
      const res = await fetch('/api/consent');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Silently handle — page will show loading state
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (field: string, value: boolean) => {
    setActionLoading(field);
    setMessage(null);
    try {
      if (!value) {
        // Withdrawing consent
        const res = await fetch('/api/consent', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consentType: field }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: data.message || t('consentWithdrawn') });
          if (field === 'marketing') setMarketingConsent(false);
          if (field === 'location') setLocationConsent(false);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const requestExport = async () => {
    setActionLoading('export');
    setMessage(null);
    try {
      const res = await fetch('/api/consent/data-export', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const downloadData = async () => {
    setActionLoading('download');
    try {
      const res = await fetch('/api/consent/data-export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: t('dataExportDownloaded') });
      }
    } catch {
      setMessage({ type: 'error', text: 'Download failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const requestDeletion = async () => {
    if (!window.confirm(t('deletionConfirm'))) return;

    setActionLoading('deletion');
    setMessage(null);
    try {
      const res = await fetch('/api/consent/data-deletion', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {status && !status.valid && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
            {status.needsRenewal ? t('renewalNeeded') : t('consentMissing')}
          </p>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`rounded-lg p-4 ${message.type === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Optional consents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-lg mb-4">{t('optionalConsents')}</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('marketingTitle')}</p>
              <p className="text-sm text-gray-500">{t('marketingDesc')}</p>
            </div>
            <button
              onClick={() => {
                const newVal = !marketingConsent;
                setMarketingConsent(newVal);
                if (!newVal) updateConsent('marketing', false);
              }}
              disabled={actionLoading === 'marketing'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                marketingConsent ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                marketingConsent ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('locationTitle')}</p>
              <p className="text-sm text-gray-500">{t('locationDesc')}</p>
            </div>
            <button
              onClick={() => {
                const newVal = !locationConsent;
                setLocationConsent(newVal);
                if (!newVal) updateConsent('location', false);
              }}
              disabled={actionLoading === 'location'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                locationConsent ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                locationConsent ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Data rights (PIPEDA Principles 9 & 10) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-lg mb-4">{t('dataRights')}</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('exportData')}</p>
              <p className="text-sm text-gray-500">{t('exportDataDesc')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadData}
                disabled={actionLoading === 'download'}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'download' ? '...' : t('download')}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">{t('deleteAccount')}</p>
                <p className="text-sm text-gray-500">{t('deleteAccountDesc')}</p>
              </div>
              <button
                onClick={requestDeletion}
                disabled={actionLoading === 'deletion'}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'deletion' ? '...' : t('requestDeletion')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Consent version info */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t('consentVersion')}: {status?.currentVersion || 'N/A'}
      </p>
    </div>
  );
}

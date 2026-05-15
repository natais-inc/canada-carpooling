'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function CookieConsent() {
  const t = useTranslations('consent');
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if consent was already given (stored in cookie, not localStorage)
    const cookieConsent = document.cookie
      .split('; ')
      .find(row => row.startsWith('cookie_consent='));
    if (!cookieConsent) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    setCookieConsent('all');
    setVisible(false);
  };

  const acceptEssential = () => {
    setCookieConsent('essential');
    setVisible(false);
  };

  const setCookieConsent = (level: string) => {
    // Set cookie with 1 year expiry, Secure + SameSite
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `cookie_consent=${level}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t('cookieTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('cookieDescription')}
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                  <span><strong>{t('essentialCookies')}</strong> — {t('essentialCookiesDesc')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                  <span><strong>{t('analyticsCookies')}</strong> — {t('analyticsCookiesDesc')}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showDetails ? t('hideDetails') : t('showDetails')}
            </button>
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={acceptEssential}
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('essentialOnly')}
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

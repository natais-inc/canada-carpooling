'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { Printer, Car } from 'lucide-react';

export default function Poster({
  locale, code, companyName, department, enabled,
}: {
  locale: string; code: string; companyName: string; department: string | null; enabled: boolean;
}) {
  const t = useTranslations('poster');
  const [qr, setQr] = useState<string>('');
  const url = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/rejoindre-entreprise/${code}` : '';

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { margin: 1, width: 520, errorCorrectionLevel: 'M' }).then(setQr).catch(() => {});
  }, [url]);

  return (
    <div className="min-h-screen bg-white">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 12mm; } }`}</style>

      <div className="no-print max-w-2xl mx-auto px-4 pt-6 flex items-center justify-between">
        <a href={`/${locale}/employer`} className="text-sm text-gray-500 hover:text-brand-700">← {t('back')}</a>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700">
          <Printer className="h-4 w-4" /> {t('print')}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-10 text-center">
        <div className="inline-flex items-center gap-2 text-brand-600 mb-8">
          <Car className="h-7 w-7" />
          <span className="text-2xl font-bold">CarpoolWork</span>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900">{companyName}</h1>
        {department ? <p className="text-lg text-gray-500 mt-1">{department}</p> : null}

        <p className="text-xl font-semibold text-gray-800 mt-8">{t('scanToJoin')}</p>

        <div className="my-6 flex justify-center">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR" className="w-72 h-72 border border-gray-200 rounded-xl p-2" />
          ) : (
            <div className="w-72 h-72 bg-gray-50 rounded-xl" />
          )}
        </div>

        {!enabled ? <p className="text-sm text-red-600 mb-4">{t('revoked')}</p> : null}

        <div className="text-left max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4">
          <p className="font-semibold text-gray-900 mb-2">{t('howToTitle')}</p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
          </ol>
        </div>

        <p className="text-sm text-gray-400 mt-6 break-all">{t('orVisit')} {url}</p>
        <p className="text-xs text-gray-400 mt-8">{t('footer')}</p>
      </div>
    </div>
  );
}

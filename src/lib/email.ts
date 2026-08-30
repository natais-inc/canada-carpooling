/**
 * CarpoolWork — email sending (Phase 4/5).
 * Provider-agnostic wrapper over Resend's REST API. Fails soft: with no
 * RESEND_API_KEY configured it becomes a no-op (logs and returns skipped), so
 * the app keeps working and links stay usable until email is turned on.
 *
 * Required env to enable sending:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — e.g. "CarpoolWork <no-reply@carpoolwork.ca>" (verified sender)
 *   NEXT_PUBLIC_APP_URL — e.g. "https://carpoolwork.ca" (for links; falls back to that)
 */

export type EmailResult = { ok: boolean; skipped?: boolean; error?: string; id?: string };

const FROM = process.env.EMAIL_FROM || 'CarpoolWork <no-reply@carpoolwork.ca>';

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://carpoolwork.ca').replace(/\/+$/, '');
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] skipped (no RESEND_API_KEY) — would send "${opts.subject}" to ${opts.to}`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text || undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[email] send failed ${res.status}: ${detail}`);
      return { ok: false, error: `status_${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data?.id };
  } catch (e: any) {
    console.error('[email] send error', e?.message || e);
    return { ok: false, error: 'exception' };
  }
}

const BRAND = '#2577eb';

/** Wrap body content in a simple, email-client-safe branded template. */
export function brandedEmail(opts: { lang: 'fr' | 'en'; heading: string; bodyHtml: string; ctaText?: string; ctaUrl?: string }): string {
  const footer =
    opts.lang === 'en'
      ? 'CarpoolWork — a NATAIS Inc. solution. You received this email because you use CarpoolWork.'
      : 'CarpoolWork — une solution de NATAIS Inc. Vous recevez ce courriel car vous utilisez CarpoolWork.';
  const cta =
    opts.ctaText && opts.ctaUrl
      ? `<tr><td style="padding:8px 0 24px;">
           <a href="${opts.ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${opts.ctaText}</a>
         </td></tr>`
      : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e9f0;border-radius:14px;padding:32px;">
          <tr><td style="font-size:20px;font-weight:800;color:${BRAND};padding-bottom:20px;">CarpoolWork</td></tr>
          <tr><td style="font-size:20px;font-weight:700;color:#1b1f27;padding-bottom:12px;">${opts.heading}</td></tr>
          <tr><td style="font-size:15px;line-height:1.55;color:#3b4150;padding-bottom:20px;">${opts.bodyHtml}</td></tr>
          ${cta}
          <tr><td style="border-top:1px solid #eef0f5;padding-top:16px;font-size:12px;color:#98a0af;">${footer}</td></tr>
        </table>
      </td></tr>
    </table></body></html>`;
}

// ---- Templates -------------------------------------------------------------

export function verificationEmail(lang: 'fr' | 'en', firstName: string, url: string) {
  if (lang === 'en') {
    return {
      subject: 'Confirm your CarpoolWork email',
      html: brandedEmail({
        lang, heading: `Hi ${firstName}, confirm your email`,
        bodyHtml: 'Confirm this email address to finish setting up your CarpoolWork account. This link expires in 48 hours.',
        ctaText: 'Confirm my email', ctaUrl: url,
      }),
      text: `Confirm your CarpoolWork email: ${url}`,
    };
  }
  return {
    subject: 'Confirmez votre courriel CarpoolWork',
    html: brandedEmail({
      lang, heading: `Bonjour ${firstName}, confirmez votre courriel`,
      bodyHtml: 'Confirmez cette adresse courriel pour terminer la configuration de votre compte CarpoolWork. Ce lien expire dans 48 heures.',
      ctaText: 'Confirmer mon courriel', ctaUrl: url,
    }),
    text: `Confirmez votre courriel CarpoolWork : ${url}`,
  };
}

export function inviteEmail(lang: 'fr' | 'en', companyName: string, url: string) {
  if (lang === 'en') {
    return {
      subject: `Join ${companyName} on CarpoolWork`,
      html: brandedEmail({
        lang, heading: `${companyName} invited you to carpool`,
        bodyHtml: `${companyName} uses CarpoolWork for commute carpooling. Accept the invitation to join and find colleagues near you.`,
        ctaText: 'Accept the invitation', ctaUrl: url,
      }),
      text: `Join ${companyName} on CarpoolWork: ${url}`,
    };
  }
  return {
    subject: `Rejoignez ${companyName} sur CarpoolWork`,
    html: brandedEmail({
      lang, heading: `${companyName} vous invite à covoiturer`,
      bodyHtml: `${companyName} utilise CarpoolWork pour le covoiturage domicile-travail. Acceptez l'invitation pour rejoindre et trouver des collègues près de chez vous.`,
      ctaText: 'Accepter l\'invitation', ctaUrl: url,
    }),
    text: `Rejoignez ${companyName} sur CarpoolWork : ${url}`,
  };
}

export function nudgeEmail(lang: 'fr' | 'en', firstName: string, url: string) {
  if (lang === 'en') {
    return {
      subject: 'Did you carpool this week?',
      html: brandedEmail({
        lang, heading: `${firstName}, a quick reminder`,
        bodyHtml: "You haven't logged a carpool in a while. Logging your trips counts toward your company's impact — and it only takes one click.",
        ctaText: 'Log a carpool', ctaUrl: url,
      }),
      text: `Log a carpool: ${url}`,
    };
  }
  return {
    subject: 'Avez-vous covoituré cette semaine ?',
    html: brandedEmail({
      lang, heading: `${firstName}, petit rappel`,
      bodyHtml: "Vous n'avez pas déclaré de covoiturage depuis un moment. Déclarer vos trajets compte dans l'impact de votre entreprise — et ça ne prend qu'un clic.",
      ctaText: 'Déclarer un covoiturage', ctaUrl: url,
    }),
    text: `Déclarer un covoiturage : ${url}`,
  };
}

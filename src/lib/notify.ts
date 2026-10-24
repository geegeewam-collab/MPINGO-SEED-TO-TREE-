// Email (Resend) and SMS (Africa's Talking) over plain HTTPS. Nothing is sent unless the keys are configured,
// and callers are told what happened so the screen never claims a message was sent when it was not.
export type SendResult = 'sent' | 'skipped' | 'failed';

export async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) return 'skipped';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!r.ok) console.error('email provider rejected the message', r.status);
    return r.ok ? 'sent' : 'failed';
  } catch { console.error('email provider unreachable'); return 'failed'; }
}

function e164(phone: string): string | null {
  const p = phone.replace(/[\s()-]/g, '');
  if (/^\+\d{9,15}$/.test(p)) return p;
  if (/^0[17]\d{8}$/.test(p)) return `+254${p.slice(1)}`; // Kenyan mobile numbers
  return null;
}

export async function sendSms(phone: string, message: string): Promise<SendResult> {
  const user = process.env.AT_USERNAME, key = process.env.AT_API_KEY, to = e164(phone);
  if (!user || !key) return 'skipped';
  if (!to) return 'failed';
  try {
    const body = new URLSearchParams({ username: user, to, message });
    if (process.env.AT_SENDER_ID) body.set('from', process.env.AT_SENDER_ID);
    const r = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST', headers: { apiKey: key, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    });
    if (!r.ok) console.error('sms provider rejected the message', r.status);
    return r.ok ? 'sent' : 'failed';
  } catch { console.error('sms provider unreachable'); return 'failed'; }
}

export function describe(email: SendResult, sms?: SendResult): string {
  if (email === 'sent' && sms === 'sent') return 'They were notified by email and SMS.';
  if (email === 'sent') return 'They were notified by email.';
  if (sms === 'sent') return 'They were notified by SMS.';
  if (email === 'skipped' && (sms === undefined || sms === 'skipped')) return 'Email is not set up yet, so nobody was notified. Please contact them directly.';
  return 'The notification could not be delivered. Please contact them directly.';
}

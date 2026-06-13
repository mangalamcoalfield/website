// Shared email transport for the careers pipeline.
// Picks whichever is configured (server-side secrets, set via `supabase secrets set`):
//   • Resend     → RESEND_API_KEY
//   • Hostinger  → SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// FROM_EMAIL / HR_EMAIL configure addresses (sensible defaults below).
// If neither transport is configured, send() is a graceful no-op (logs + reports
// not-configured) so the plumbing is safe to deploy before keys are added.

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export const HR_EMAIL = Deno.env.get('HR_EMAIL') ?? 'hr@mangalamcoal.com';
export const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'careers@mangalamcoal.com';
export const FROM_NAME = Deno.env.get('FROM_NAME') ?? 'Mangalam Coalfield Careers';

export interface MailInput {
  to?: string;
  subject: string;
  html: string;
  text?: string;
}
export interface MailResult {
  ok: boolean;
  transport: 'resend' | 'smtp' | 'none';
  error?: string;
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function sendViaResend(m: Required<Pick<MailInput, 'to'>> & MailInput, key: string): Promise<MailResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text ?? htmlToText(m.html),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { ok: false, transport: 'resend', error: `resend ${res.status}: ${detail.slice(0, 200)}` };
  }
  return { ok: true, transport: 'resend' };
}

async function sendViaSmtp(m: Required<Pick<MailInput, 'to'>> & MailInput): Promise<MailResult> {
  const host = Deno.env.get('SMTP_HOST')!;
  const port = Number(Deno.env.get('SMTP_PORT') ?? '465');
  const user = Deno.env.get('SMTP_USER')!;
  const pass = Deno.env.get('SMTP_PASS')!;
  const client = new SMTPClient({
    connection: { hostname: host, port, tls: port === 465, auth: { username: user, password: pass } },
  });
  try {
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: m.to,
      subject: m.subject,
      content: m.text ?? htmlToText(m.html),
      html: m.html,
    });
    await client.close();
    return { ok: true, transport: 'smtp' };
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    return { ok: false, transport: 'smtp', error: `smtp: ${String(e).slice(0, 200)}` };
  }
}

export async function sendEmail(input: MailInput): Promise<MailResult> {
  const to = input.to ?? HR_EMAIL;
  const m = { ...input, to };

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) return sendViaResend(m, resendKey);

  if (Deno.env.get('SMTP_HOST') && Deno.env.get('SMTP_USER') && Deno.env.get('SMTP_PASS')) {
    return sendViaSmtp(m);
  }

  console.warn('[email] no transport configured (set RESEND_API_KEY or SMTP_*) — skipping send to', to);
  return { ok: false, transport: 'none', error: 'no_transport_configured' };
}

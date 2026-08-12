import type { APIRoute } from 'astro';

// Serverless (Vercel) — sends an email notification when a contact enquiry or a
// job application is submitted. The form still saves to Supabase client-side;
// this is a best-effort notification on top, so it degrades gracefully: if SMTP
// isn't configured yet, it returns ok:false (200) and the form flow is unharmed.
// Server-only env (NEVER PUBLIC_-prefixed): SMTP_HOST/PORT/USER/PASS, NOTIFY_TO.
export const prerender = false;

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string>)[k];
const SMTP_HOST = env('SMTP_HOST');
const SMTP_PORT = Number(env('SMTP_PORT') ?? '465');
const SMTP_USER = env('SMTP_USER');
const SMTP_PASS = env('SMTP_PASS');
const NOTIFY_TO = env('NOTIFY_TO') ?? SMTP_USER;

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

const clip = (s: unknown, n = 4000) => String(s ?? '').slice(0, n);

// Best-effort per-IP throttle (per warm instance), same approach as /api/ask.
// Without this the endpoint is an open relay into the enquiry inbox: it is
// unauthenticated by necessity, so anyone could POST it in a loop.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 4;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RL_MAX;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Not configured yet → succeed quietly (the DB record was already saved).
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return json({ ok: false, error: 'email_not_configured' });

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Both forms always send a name and an email; anything without them is not a
  // real submission, so don't turn it into an email.
  const name = clip(body.name, 200).trim();
  const email = clip(body.email, 200).trim();
  const message = clip(body.message).trim();
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!name || !okEmail) return json({ ok: false, error: 'invalid_submission' }, 400);
  if (body.type !== 'application' && !message) return json({ ok: false, error: 'invalid_submission' }, 400);

  const type = body.type === 'application' ? 'application' : 'lead';
  const subject = type === 'application'
    ? `New job application — ${clip(body.jobTitle, 120) || 'General'}`
    : `New website enquiry — ${clip(body.name, 120)}`;
  const lines = type === 'application'
    ? ['New job application via mangalamcoal.com', '', `Role: ${clip(body.jobTitle, 200) || '—'}`,
       `Name: ${clip(body.name, 200)}`, `Email: ${clip(body.email, 200)}`, `Phone: ${clip(body.phone, 60)}`,
       `Résumé: ${clip(body.resumeUrl, 600) || '—'}`]
    : ['New enquiry via mangalamcoal.com', '', `Name: ${clip(body.name, 200)}`,
       `Email: ${clip(body.email, 200)}`, '', 'Message:', clip(body.message)];

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: `"Mangalam Coalfield — Website" <${SMTP_USER}>`,
      to: NOTIFY_TO,
      replyTo: typeof body.email === 'string' && body.email ? body.email : undefined,
      subject,
      text: lines.join('\n'),
    });
    return json({ ok: true });
  } catch (e) {
    console.error('[notify] send failed:', e);
    return json({ ok: false, error: 'send_failed' });
  }
};

export const GET: APIRoute = () => json({ error: 'method_not_allowed' }, 405);

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Serverless (Vercel) — sends an email notification when a contact enquiry or a
// job application is submitted. The form still saves to Supabase client-side;
// this is a best-effort notification on top, so it degrades gracefully: if SMTP
// isn't configured yet, it returns ok:false (200) and the form flow is unharmed.
// Server-only env (NEVER PUBLIC_-prefixed): SMTP_HOST/PORT/USER/PASS, NOTIFY_TO,
// SUPABASE_SERVICE_KEY.
//
// The email is built ONLY from the row the form just saved, looked up here with
// the service key. Nothing the caller sends is echoed into it: this endpoint is
// public by necessity, and when it trusted the request body anyone could make
// our own noreply address deliver an arbitrary "résumé" link to HR — a phishing
// channel aimed at the people who handle applicants' personal data.
export const prerender = false;

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string>)[k];
const SMTP_HOST = env('SMTP_HOST');
const SMTP_PORT = Number(env('SMTP_PORT') ?? '465');
const SMTP_USER = env('SMTP_USER');
const SMTP_PASS = env('SMTP_PASS');
const NOTIFY_TO = env('NOTIFY_TO') ?? SMTP_USER;
const SUPABASE_URL = env('PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_KEY');

// Only a row saved this recently can trigger a notification.
const FRESH_MS = 15 * 60_000;
const ADMIN_VIEW = 'https://mangalamcoal.com/admin/applications';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

const clip = (s: unknown, n = 4000) => String(s ?? '').slice(0, n);

// Best-effort per-IP throttle (per warm instance), same approach as /api/ask.
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

// One email per saved row, so a single real submission can't be replayed into
// a stream of notifications. Per warm instance — best-effort, like the throttle.
const notified = new Set<string>();

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Not configured yet → succeed quietly (the DB record was already saved).
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return json({ ok: false, error: 'email_not_configured' });
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: 'lookup_not_configured' });

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Exact match only — ilike would treat % and _ in a crafted address as wildcards.
  const email = clip(body.email, 200).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'invalid_submission' }, 400);
  const type = body.type === 'application' ? 'application' : 'lead';

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const since = new Date(Date.now() - FRESH_MS).toISOString();

  let subject: string;
  let lines: string[];
  let replyTo: string;
  let rowId: string;

  if (type === 'application') {
    const { data: row } = await db.from('applications')
      .select('id,name,email,phone,job_id')
      .eq('email', email).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!row) return json({ ok: false, error: 'not_found' }, 404);
    rowId = `a:${row.id}`;
    let role = 'General';
    if (row.job_id) {
      const { data: job } = await db.from('jobs').select('title').eq('id', row.job_id).maybeSingle();
      if (job?.title) role = job.title;
    }
    subject = `New job application — ${clip(role, 120)}`;
    lines = ['New job application via mangalamcoal.com', '', `Role: ${clip(role, 200)}`,
      `Name: ${clip(row.name, 200)}`, `Email: ${clip(row.email, 200)}`, `Phone: ${clip(row.phone, 60) || '—'}`,
      '', `Résumé and answers: ${ADMIN_VIEW}`];
    replyTo = row.email;
  } else {
    const { data: row } = await db.from('leads')
      .select('id,name,email,message')
      .eq('email', email).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!row) return json({ ok: false, error: 'not_found' }, 404);
    rowId = `l:${row.id}`;
    subject = `New website enquiry — ${clip(row.name, 120)}`;
    lines = ['New enquiry via mangalamcoal.com', '', `Name: ${clip(row.name, 200)}`,
      `Email: ${clip(row.email, 200)}`, '', 'Message:', clip(row.message)];
    replyTo = row.email;
  }

  if (notified.has(rowId)) return json({ ok: true, duplicate: true });

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: `"Mangalam Coalfield — Website" <${SMTP_USER}>`,
      to: NOTIFY_TO,
      replyTo,
      subject,
      text: lines.join('\n'),
    });
    notified.add(rowId);
    return json({ ok: true });
  } catch (e) {
    console.error('[notify] send failed:', e);
    return json({ ok: false, error: 'send_failed' });
  }
};

export const GET: APIRoute = () => json({ error: 'method_not_allowed' }, 405);

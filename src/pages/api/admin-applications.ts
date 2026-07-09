import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Password-gated read of applications for the admin view. Requires the
// SERVICE-ROLE key (server-only) + ADMIN_PASSWORD env. Résumé links are signed
// and valid for 24h. No data is exposed without the correct password.
export const prerender = false;

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string>)[k];
const SUPABASE_URL = env('PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_KEY');
const ADMIN_PASSWORD = env('ADMIN_PASSWORD');

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'not_configured' });
  if (!ADMIN_PASSWORD) return json({ error: 'no_password_set' });
  let body: { password?: string } = {};
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!body.password || body.password !== ADMIN_PASSWORD) return json({ error: 'unauthorized' }, 401);

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: apps, error } = await db.from('applications')
    .select('created_at,name,email,phone,job_id,resume_url,details')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return json({ error: 'query_failed', detail: error.message }, 500);

  const { data: jobs } = await db.from('jobs').select('id,title');
  const jt: Record<string, string> = Object.fromEntries((jobs ?? []).map((j) => [j.id, j.title]));

  const out = [];
  for (const a of apps ?? []) {
    let resume = '';
    if (a.resume_url) {
      const { data: s } = await db.storage.from('resumes').createSignedUrl(a.resume_url, 60 * 60 * 24);
      if (s?.signedUrl) resume = s.signedUrl;
    }
    out.push({
      created_at: a.created_at, name: a.name, email: a.email, phone: a.phone || '',
      role: jt[a.job_id] || '', details: a.details || {}, resume,
    });
  }
  return json({ ok: true, count: out.length, applications: out });
};

export const GET: APIRoute = () => json({ error: 'method_not_allowed' }, 405);

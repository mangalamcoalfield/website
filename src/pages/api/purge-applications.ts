import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Daily job (Vercel Cron): enforces the retention promise made on /privacy —
// application data and résumés are purged 90 days after they were submitted.
//
// What a purge does, per record older than RETENTION_DAYS:
//   1. deletes the résumé object from the private `resumes` storage bucket
//   2. clears the personal fields on the row (name, email, phone, résumé path
//      and the role-specific `details`, which carry things like certificate
//      numbers and remuneration)
//   3. stamps `resume_purged_at` so the record is never reprocessed
//
// The row itself is kept, but only as an anonymous shell (id, job_id,
// created_at, consent) so historical application counts still work. That is the
// proportionate reading of "purged": the personal data goes, the tally stays.
//
// Secured with CRON_SECRET (Vercel sends `Authorization: Bearer $CRON_SECRET`).
// Pass ?dry=1 to report what WOULD be purged without touching anything.
export const prerender = false;

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string>)[k];
const SUPABASE_URL = env('PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_KEY');
const CRON_SECRET = env('CRON_SECRET');

const RETENTION_DAYS = 90;
const BUCKET = 'resumes';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

async function run(dry: boolean): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: 'supabase_service_not_configured' });

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: due, error } = await db
    .from('applications')
    .select('id,created_at,resume_url')
    .lt('created_at', cutoff)
    .is('resume_purged_at', null);
  if (error) return json({ ok: false, error: 'query_failed', detail: error.message });

  const rows = due ?? [];
  if (dry) {
    return json({
      ok: true, dryRun: true, retentionDays: RETENTION_DAYS, cutoff,
      wouldPurge: rows.length,
      oldest: rows.length ? rows.reduce((a, r) => (r.created_at < a ? r.created_at : a), rows[0].created_at) : null,
      withResume: rows.filter((r) => r.resume_url).length,
    });
  }
  if (!rows.length) return json({ ok: true, purged: 0, retentionDays: RETENTION_DAYS, cutoff });

  // 1. remove the résumé files
  const paths = rows.map((r) => r.resume_url).filter(Boolean) as string[];
  let filesRemoved = 0;
  let storageError: string | null = null;
  if (paths.length) {
    const { data: removed, error: sErr } = await db.storage.from(BUCKET).remove(paths);
    if (sErr) storageError = sErr.message;
    else filesRemoved = removed?.length ?? 0;
  }
  // Don't clear the DB pointer if the file delete failed — otherwise the object
  // is orphaned in the bucket with nothing left pointing at it.
  if (storageError) return json({ ok: false, error: 'storage_delete_failed', detail: storageError, purged: 0 }, 500);

  // 2. clear the personal fields
  const { error: uErr } = await db
    .from('applications')
    .update({ name: null, email: null, phone: null, resume_url: null, details: null, resume_purged_at: new Date().toISOString() })
    .in('id', rows.map((r) => r.id));
  if (uErr) return json({ ok: false, error: 'update_failed', detail: uErr.message, filesRemoved }, 500);

  console.log(`[purge-applications] purged ${rows.length} record(s), removed ${filesRemoved} résumé file(s)`);
  return json({ ok: true, purged: rows.length, filesRemoved, retentionDays: RETENTION_DAYS, cutoff });
}

export const GET: APIRoute = async ({ request }) => {
  if (CRON_SECRET) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) return json({ error: 'unauthorized' }, 401);
  }
  const dry = new URL(request.url).searchParams.get('dry') === '1';
  try { return await run(dry); } catch (e) {
    console.error('[purge-applications] failed:', e);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

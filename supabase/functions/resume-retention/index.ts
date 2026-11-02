// resume-retention — scheduled daily (pg_cron). Enforces résumé retention: for
// applications older than the grace window, delete the résumé from Storage and
// mark it purged. Also removes the one-off RLS test artifact. Uses the service
// role (server-side only).
//
// Policy: purge every résumé older than the grace window, whether or not the
// notification email was ever delivered.
// RETENTION_DAYS overrides the default grace window. --no-verify-jwt + guard.
//
// Also sweeps ORPHANED résumés: objects in the `resumes` bucket older than the
// grace window that no applications row references (the upload succeeded but
// the row insert failed, the row was deleted by hand, or junk uploaded with the
// public key). Without this they were never purged at all.
// Dry run: POST …/resume-retention?dry_run=1 (or set ORPHAN_DRY_RUN=1 on the
// function) logs and reports what WOULD be deleted, and deletes nothing.

import { adminClient, authorized, json } from '../_shared/util.ts';

// 90 days, matching the retention window stated on /privacy. If the
// RETENTION_DAYS secret is ever set on the function it overrides this default —
// keep the two in step, or the site will promise one window and apply another.
const RETENTION_DAYS = Number(Deno.env.get('RETENTION_DAYS') ?? '90');
const TEST_ARTIFACT = '__rlstest__/rlscheck.txt';
const BUCKET = 'resumes';
const PAGE = 1000;

type StorageClient = ReturnType<typeof adminClient>;

/** Every object (not folder) in the bucket, recursing into folders, paginated. */
async function listAllObjects(supabase: StorageClient, prefix = ''): Promise<{ path: string; created_at: string | null }[]> {
  const out: { path: string; created_at: string | null }[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list ${prefix || '/'}: ${error.message}`);
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders come back as entries without an id.
      if (item.id == null) out.push(...(await listAllObjects(supabase, path)));
      else out.push({ path, created_at: item.created_at ?? null });
    }
    if ((data?.length ?? 0) < PAGE) break;
  }
  return out;
}

/** Every resume_url still referenced by an applications row, paginated. */
async function referencedPaths(supabase: StorageClient): Promise<Set<string>> {
  const refs = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('applications')
      .select('resume_url')
      .not('resume_url', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`applications lookup: ${error.message}`);
    for (const r of data ?? []) refs.add(r.resume_url as string);
    if ((data?.length ?? 0) < PAGE) break;
  }
  return refs;
}

Deno.serve(async (req) => {
  // Without this a plain GET or OPTIONS ran the whole job.
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401);

  const supabase = adminClient();
  const summary: Record<string, unknown> = { retention_days: RETENTION_DAYS };

  // 0) Remove the leftover RLS test file (idempotent).
  const { data: removedTest } = await supabase.storage.from('resumes').remove([TEST_ARTIFACT]);
  summary.test_artifact_removed = (removedTest?.length ?? 0) > 0;

  // 1) Find applications past the grace window with a résumé still stored.
  //
  // Deliberately NOT filtered on notified_at. This previously required delivery
  // to be confirmed, but notified_at is only stamped when the notification email
  // actually sends — and that pipeline is designed to no-op gracefully when SMTP
  // is unconfigured or failing. So a mail outage would have quietly parked those
  // résumés outside the purge forever, breaking the 90-day retention promised on
  // /privacy. Retention is a legal maximum: it runs on the age of the record,
  // regardless of whether HR ever got an email about it.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: due, error } = await supabase
    .from('applications')
    .select('id, resume_url')
    .is('resume_purged_at', null)      // not already purged
    .not('resume_url', 'is', null)     // still has a file
    .lt('created_at', cutoff);         // past grace window

  if (error) return json({ error: error.message, ...summary }, 500);

  let purged = 0;
  const failures: string[] = [];
  for (const app of due ?? []) {
    const path = app.resume_url as string;
    const { error: delErr } = await supabase.storage.from('resumes').remove([path]);
    if (delErr) { failures.push(`${app.id}: ${delErr.message}`); continue; }
    await supabase
      .from('applications')
      .update({ resume_purged_at: new Date().toISOString(), resume_url: null })
      .eq('id', app.id);
    purged += 1;
  }

  summary.candidates_due = due?.length ?? 0;
  summary.resumes_purged = purged;

  // 2) Orphan sweep. Objects are listed BEFORE the references are read, so a
  //    row inserted mid-run can only add references (never cause a wrong
  //    delete); and only objects older than the grace window are eligible.
  const dryRun = new URL(req.url).searchParams.get('dry_run') === '1' ||
    Deno.env.get('ORPHAN_DRY_RUN') === '1';
  summary.orphan_dry_run = dryRun;
  try {
    const objects = await listAllObjects(supabase);
    const refs = await referencedPaths(supabase); // throws → no deletes at all
    const cutoffMs = Date.parse(cutoff);
    const orphans = objects
      .filter((o) => o.created_at && Date.parse(o.created_at) < cutoffMs)
      .filter((o) => !refs.has(o.path))
      .map((o) => o.path);

    summary.objects_scanned = objects.length;
    summary.orphans_found = orphans.length;
    let orphansDeleted = 0;
    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100);
      if (dryRun) {
        console.log(`[resume-retention] dry run — would delete ${batch.length} orphan(s):`, batch);
        continue;
      }
      const { data: removed, error: rmErr } = await supabase.storage.from(BUCKET).remove(batch);
      if (rmErr) { failures.push(`orphans[${i}..]: ${rmErr.message}`); continue; }
      orphansDeleted += removed?.length ?? 0;
    }
    if (!dryRun) console.log(`[resume-retention] deleted ${orphansDeleted} orphaned résumé(s)`);
    summary.orphans_deleted = orphansDeleted;
  } catch (e) {
    console.error('[resume-retention] orphan sweep skipped:', e);
    failures.push(`orphan sweep skipped: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (failures.length) summary.failures = failures;
  return json({ ok: true, ...summary });
});

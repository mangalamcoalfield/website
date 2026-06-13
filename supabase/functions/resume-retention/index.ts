// resume-retention — scheduled daily (pg_cron). Enforces résumé retention:
// for applications that were NOTIFIED (delivered) and are older than the grace
// window, delete the résumé from Storage and mark it purged. Also removes the
// one-off RLS test artifact. Uses the service role (server-side only).
//
// Policy: forward → confirm delivery (notified_at set) → grace window → purge.
// RETENTION_DAYS overrides the default grace window. --no-verify-jwt + guard.

import { adminClient, authorized, json } from '../_shared/util.ts';

const RETENTION_DAYS = Number(Deno.env.get('RETENTION_DAYS') ?? '30');
const TEST_ARTIFACT = '__rlstest__/rlscheck.txt';

Deno.serve(async (req) => {
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401);

  const supabase = adminClient();
  const summary: Record<string, unknown> = { retention_days: RETENTION_DAYS };

  // 0) Remove the leftover RLS test file (idempotent).
  const { data: removedTest } = await supabase.storage.from('resumes').remove([TEST_ARTIFACT]);
  summary.test_artifact_removed = (removedTest?.length ?? 0) > 0;

  // 1) Find delivered applications past the grace window with a résumé still stored.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: due, error } = await supabase
    .from('applications')
    .select('id, resume_url')
    .not('notified_at', 'is', null)   // delivery confirmed
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
  if (failures.length) summary.failures = failures;
  return json({ ok: true, ...summary });
});

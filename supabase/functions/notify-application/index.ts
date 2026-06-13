// notify-application — fires on every new row in public.applications (via a DB
// trigger → pg_net POST). Emails hr@ immediately with the candidate name, role
// and a time-limited signed résumé link. Idempotent: sets applications.notified_at
// and skips if already set, so retries/duplicate webhook calls don't re-spam.
//
// Deployed with --no-verify-jwt; protected by the optional WEBHOOK_SECRET guard.
// NO résumé-content AI summarisation here — that is a manual, end-of-day step.

import { adminClient, authorized, json } from '../_shared/util.ts';
import { sendEmail, HR_EMAIL } from '../_shared/email.ts';

const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401);

  let appId: string | undefined;
  try {
    const body = await req.json();
    // Supabase DB webhook shape: { type, table, record, old_record }
    appId = body?.record?.id ?? body?.id ?? body?.application_id;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!appId) return json({ error: 'missing_application_id' }, 400);

  const supabase = adminClient();

  // Re-read the row server-side (don't trust the payload for PII).
  const { data: app, error } = await supabase
    .from('applications')
    .select('id, name, email, phone, job_id, resume_url, notified_at, created_at')
    .eq('id', appId)
    .single();

  if (error || !app) return json({ error: 'not_found' }, 404);
  if (app.notified_at) return json({ ok: true, skipped: 'already_notified' });

  // Resolve role title.
  let role = 'General application';
  if (app.job_id) {
    const { data: job } = await supabase.from('jobs').select('title').eq('id', app.job_id).single();
    if (job?.title) role = job.title;
  }

  // Time-limited signed link to the (private) résumé.
  let resumeLink = '(no résumé attached)';
  if (app.resume_url) {
    const { data: signed } = await supabase.storage
      .from('resumes')
      .createSignedUrl(app.resume_url, SIGNED_URL_TTL);
    if (signed?.signedUrl) resumeLink = signed.signedUrl;
  }

  const appliedAt = new Date(app.created_at).toUTCString();
  const html = `
    <h2 style="font-family:Arial,sans-serif">New job application</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#555">Name</td><td><strong>${escapeHtml(app.name)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#555">Role</td><td>${escapeHtml(role)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#555">Email</td><td>${escapeHtml(app.email)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#555">Phone</td><td>${escapeHtml(app.phone ?? '—')}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#555">Applied</td><td>${appliedAt}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#555">Résumé</td><td>${app.resume_url ? `<a href="${resumeLink}">Download (link valid 7 days)</a>` : '—'}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Automated notification from the Mangalam Coalfield careers site.</p>`;

  const result = await sendEmail({
    to: HR_EMAIL,
    subject: `New application — ${app.name} (${role})`,
    html,
  });

  // Mark notified only when the email actually went out, so retention never
  // purges a résumé that was never delivered.
  if (result.ok) {
    await supabase.from('applications').update({ notified_at: new Date().toISOString() }).eq('id', appId);
  }

  return json({ ok: result.ok, transport: result.transport, error: result.error });
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

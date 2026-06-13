// application-digest — scheduled daily (pg_cron). Sends hr@ a consolidated
// digest of application METADATA from the last 24h: name, role, date, résumé
// link. Pure SQL, NO AI. Deployed with --no-verify-jwt; WEBHOOK_SECRET-guarded.

import { adminClient, authorized, json } from '../_shared/util.ts';
import { sendEmail, HR_EMAIL } from '../_shared/email.ts';

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

Deno.serve(async (req) => {
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401);

  const supabase = adminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: apps, error } = await supabase
    .from('applications')
    .select('id, name, email, job_id, resume_url, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, 500);
  if (!apps || apps.length === 0) {
    return json({ ok: true, count: 0, note: 'no new applications in last 24h — digest skipped' });
  }

  // Resolve role titles in one pass.
  const jobIds = [...new Set(apps.map((a) => a.job_id).filter(Boolean))] as string[];
  const titles: Record<string, string> = {};
  if (jobIds.length) {
    const { data: jobs } = await supabase.from('jobs').select('id, title').in('id', jobIds);
    for (const j of jobs ?? []) titles[j.id] = j.title;
  }

  const rows = await Promise.all(
    apps.map(async (a) => {
      let link = '—';
      if (a.resume_url) {
        const { data: signed } = await supabase.storage.from('resumes').createSignedUrl(a.resume_url, SIGNED_URL_TTL);
        if (signed?.signedUrl) link = `<a href="${signed.signedUrl}">résumé</a>`;
      }
      const role = a.job_id ? (titles[a.job_id] ?? 'Unknown role') : 'General application';
      const date = new Date(a.created_at).toISOString().slice(0, 10);
      return `<tr><td style="padding:5px 14px 5px 0">${esc(a.name)}</td><td style="padding:5px 14px 5px 0">${esc(role)}</td><td style="padding:5px 14px 5px 0">${date}</td><td style="padding:5px 0">${link}</td></tr>`;
    })
  );

  const html = `
    <h2 style="font-family:Arial,sans-serif">Daily applications digest — ${apps.length} new</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      <tr style="text-align:left;color:#555"><th style="padding:5px 14px 5px 0">Name</th><th style="padding:5px 14px 5px 0">Role</th><th style="padding:5px 14px 5px 0">Date</th><th>Résumé</th></tr>
      ${rows.join('')}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Metadata only. Résumé links valid 7 days. No AI summarisation.</p>`;

  const result = await sendEmail({
    to: HR_EMAIL,
    subject: `Applications digest — ${apps.length} new (${new Date().toISOString().slice(0, 10)})`,
    html,
  });

  return json({ ok: result.ok, count: apps.length, transport: result.transport, error: result.error });
});

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

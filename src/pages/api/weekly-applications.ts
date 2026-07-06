import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

// Weekly job (Vercel Cron): compiles the last 7 days of applications into an
// .xlsx and emails it to the recruitment leads. Reads the private `applications`
// table with the Supabase SERVICE-ROLE key (server-only). Secured via CRON_SECRET
// (Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations).
export const prerender = false;

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string>)[k];
const SUPABASE_URL = env('PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_KEY');
const CRON_SECRET = env('CRON_SECRET');
const SMTP_HOST = env('SMTP_HOST');
const SMTP_PORT = Number(env('SMTP_PORT') ?? '465');
const SMTP_USER = env('SMTP_USER');
const SMTP_PASS = env('SMTP_PASS');
const REPORT_TO = env('REPORT_TO') ?? 'md@mangalamcoal.com,prashalya@mangalamcoal.com';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// Columns: fixed base + role-specific detail keys (match the form field names).
const DETAIL_COLS = ['Current location', 'Notice period', 'Current CTC', 'Expected CTC',
  'Certificate', 'Certificate no.', 'Experience (yrs)', 'Qualification', 'Membership no.', 'Gas Testing / First-Aid'];

async function run(): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: 'supabase_service_not_configured' });
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return json({ ok: false, error: 'smtp_not_configured' });

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: apps, error } = await db.from('applications')
    .select('created_at,name,email,phone,job_id,resume_url,details')
    .gte('created_at', sinceIso).order('created_at', { ascending: false });
  if (error) return json({ ok: false, error: 'query_failed', detail: error.message });

  const { data: jobs } = await db.from('jobs').select('id,title');
  const jobTitle: Record<string, string> = Object.fromEntries((jobs ?? []).map((j) => [j.id, j.title]));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Applications');
  ws.columns = [
    { header: 'Submitted', key: 'submitted', width: 18 },
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Role', key: 'role', width: 30 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone', key: 'phone', width: 16 },
    ...DETAIL_COLS.map((c) => ({ header: c, key: c, width: 18 })),
    { header: 'Résumé', key: 'resume', width: 50 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const a of apps ?? []) {
    let resume = a.resume_url || '';
    if (a.resume_url) {
      const { data: signed } = await db.storage.from('resumes').createSignedUrl(a.resume_url, 60 * 60 * 24 * 14);
      if (signed?.signedUrl) resume = signed.signedUrl;
    }
    const d = (a.details || {}) as Record<string, string>;
    const row: Record<string, unknown> = {
      submitted: a.created_at ? new Date(a.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
      name: a.name, role: jobTitle[a.job_id] || a.job_id || '', email: a.email, phone: a.phone || '', resume,
    };
    for (const c of DETAIL_COLS) row[c] = d[c] || '';
    ws.addRow(row);
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const stamp = new Date().toISOString().slice(0, 10);
  const count = apps?.length ?? 0;

  const nodemailer = (await import('nodemailer')).default;
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transport.sendMail({
    from: `"Mangalam Coalfield — Website" <${SMTP_USER}>`,
    to: REPORT_TO,
    subject: `Weekly job applications — ${count} in the last 7 days (${stamp})`,
    text: `Attached: ${count} application${count === 1 ? '' : 's'} received in the last 7 days (as at ${stamp}). Résumé links in the sheet are valid for 14 days.`,
    attachments: [{ filename: `mangalam-applications-${stamp}.xlsx`, content: buffer }],
  });

  return json({ ok: true, count });
}

export const GET: APIRoute = async ({ request }) => {
  if (CRON_SECRET) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) return json({ error: 'unauthorized' }, 401);
  }
  try { return await run(); } catch (e) {
    console.error('[weekly-applications] failed:', e);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

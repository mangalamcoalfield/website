# Secrets & switches (reference — NEVER put real values in git)

Two subsystems, two secret stores. All values are server-side only.

## 1) Ask Mangalam bot → **Vercel** env vars (project `mangalam-website`)

| Name | Required | Notes |
|------|----------|-------|
| `GEMINI_API_KEY` | yes | Google AI Studio key (free tier). **Do NOT** prefix with `PUBLIC_`. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.0-flash-lite`. |
| `CRON_SECRET` | **yes** | Any random string. `/api/weekly-applications` (Vercel Cron) refuses to run (500) while it is unset and returns 401 without `Authorization: Bearer $CRON_SECRET`, which Vercel Cron sends automatically. |

Add via CLI:
```
vercel env add GEMINI_API_KEY production   # paste value when prompted
vercel env add GEMINI_API_KEY preview production <gitbranch> ...  # optional
```
Then **redeploy** (env vars bind at deploy time): push any commit, or `vercel redeploy`.
Set a **hard spend cap** on the Google side — that is the real quota backstop.

## 2) Careers email/résumé pipeline → **Supabase** function secrets

Set with `supabase secrets set NAME=value` (applies to deployed functions on next call — no redeploy needed). Choose ONE transport:

| Name | Notes |
|------|-------|
| `RESEND_API_KEY` | Resend transport (simplest). Sender domain must be verified. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | Hostinger SMTP fallback (port 465 = TLS). |
| `FROM_EMAIL` | e.g. `careers@mangalamcoal.com` (default). |
| `HR_EMAIL` | recipient, default `hr@mangalamcoal.com`. |
| `RETENTION_DAYS` | résumé grace window before purge, default `90` (must match the window stated on /privacy). |
| `WEBHOOK_SECRET` | **REQUIRED.** Shared secret; functions reject every call (401) while it is unset (see below). |

The Supabase **service role key is auto-injected** into edge functions — you do NOT set it.

### Required: the shared webhook secret (`WEBHOOK_SECRET`)
The edge functions **fail closed**: if `WEBHOOK_SECRET` is unset, or the caller's
`x-webhook-secret` header does not match, they return 401 and do nothing
(no emails, no digest, no résumé purge). Pick one random string and set it in
BOTH places (same value):

1. **Supabase function secrets** (read by `supabase/functions/_shared/util.ts`):
   ```
   supabase secrets set WEBHOOK_SECRET=<random>
   ```
   (or Dashboard → Edge Functions → Secrets)
2. **Supabase Vault**, entry name `webhook_secret` — read by `supabase/pipeline.sql`
   (the `handle_new_application` trigger and both pg_cron jobs) and sent as the
   `x-webhook-secret` header:
   ```sql
   -- in the SQL editor:
   select vault.create_secret('<random>', 'webhook_secret');
   -- rotating later:
   -- select vault.update_secret((select id from vault.secrets where name='webhook_secret'), '<new>');
   ```

Generate a value with e.g. `openssl rand -hex 32`.

## What is already created (no action needed)
- DB tables, RLS, `resumes` bucket — applied & verified.
- Edge functions deployed: `notify-application`, `application-digest`, `resume-retention`.
- DB trigger on `applications` insert + daily pg_cron jobs (digest 03:00 UTC, retention 03:30 UTC).
- Bot endpoint `/api/ask` + widget live (degrades gracefully until `GEMINI_API_KEY` is set).

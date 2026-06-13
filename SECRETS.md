# Secrets & switches (reference — NEVER put real values in git)

Two subsystems, two secret stores. All values are server-side only.

## 1) Ask Mangalam bot → **Vercel** env vars (project `mangalam-website`)

| Name | Required | Notes |
|------|----------|-------|
| `GEMINI_API_KEY` | yes | Google AI Studio key (free tier). **Do NOT** prefix with `PUBLIC_`. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.0-flash-lite`. |

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
| `RETENTION_DAYS` | résumé grace window before purge, default `30`. |
| `WEBHOOK_SECRET` | optional shared secret to lock down the functions (see below). |

The Supabase **service role key is auto-injected** into edge functions — you do NOT set it.

### Optional: lock the functions with a shared secret
Pick one random string; set it in BOTH places (same value):
```
supabase secrets set WEBHOOK_SECRET=<random>
```
```sql
-- in the SQL editor (Vault):
select vault.create_secret('<random>', 'webhook_secret');
```
Without it, the functions accept calls unauthenticated (fine for launch, but the
secret stops anyone from invoking them directly).

## What is already created (no action needed)
- DB tables, RLS, `resumes` bucket — applied & verified.
- Edge functions deployed: `notify-application`, `application-digest`, `resume-retention`.
- DB trigger on `applications` insert + daily pg_cron jobs (digest 03:00 UTC, retention 03:30 UTC).
- Bot endpoint `/api/ask` + widget live (degrades gracefully until `GEMINI_API_KEY` is set).

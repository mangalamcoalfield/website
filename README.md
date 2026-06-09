# Mangalam Coalfield — Public Website

Public corporate + knowledge-hub site for **Mangalam Coalfield Private Limited**.
Built with **Astro** (static-first, minimal JS), self-hosted fonts, and **Supabase**
for data-driven sections and form capture. Deployed on **Vercel**.

> Separate project from the internal ops app (`app.mangalamcoal.com`) — siblings
> sharing a design language, not one system.

## Stack

- **Astro 5** — static output, Vercel adapter, sitemap.
- **Styling** — CSS variables ported verbatim from the approved design tokens
  (`src/styles/global.css`). No Tailwind; no font CDN.
- **Fonts** — self-hosted via `@fontsource` (Archivo 500/600/700, Hanken Grotesk
  400/500/600).
- **Supabase** — anon/publishable key on the client under RLS. Build-time data
  fetch for `jobs` / `csr_projects` / `knowledge_entries` / `nci_history` with a
  graceful placeholder fallback; client-side `INSERT` for forms.

## Local development

```bash
npm install
cp .env.example .env   # already populated with the public Supabase config
npm run dev            # http://localhost:4321
npm run build          # static build → dist/ and .vercel/output
```

## Environment variables

Only `PUBLIC_`-prefixed vars reach the browser (Astro convention).

| Var | Where | Notes |
|-----|-------|-------|
| `PUBLIC_SUPABASE_URL` | `.env` (gitignored) + Vercel | Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | `.env` (gitignored) + Vercel | Publishable key (safe on client) |
| `SUPABASE_SECRET_KEY` | **GitHub Actions secret only** | `sb_secret_…` — never in client code or git. Edge functions / keep-alive only. |

## Database

`supabase/schema.sql` creates all tables, RLS policies, the private `resumes`
storage bucket, and a `keepalive` table. Run it in the Supabase SQL editor.
Optional demo rows: `supabase/seed.sql`.

**RLS summary (anon):** SELECT only published `jobs`/`csr_projects`/`knowledge_entries`/`nci_history`;
INSERT only into `applications`/`leads` with `consent = true`; résumé uploads are
write-only into the `resumes` bucket. Nothing else.

## Pages

Home · About/Leadership · Operations · Safety · Learn (hub + articles) · Mangalam
Cares · Careers (+JobPosting schema) · Contact · Privacy · 404. Employee Portal is
a button to `https://app.mangalamcoal.com`.

## Publish-filter

Only content already public through an official channel goes live. No confidential
DPR data, no site-specific gas readings, no internal production figures. See the
build brief for the full discipline.

## Later hooks (left clean, not yet wired)

- Per-application email to `hr@mangalamcoal.com` + consolidated digest (edge function).
- "Ask Mangalam" client-side retrieval bot over vetted JSON.
- Monthly NCI update (manual one-number or GitHub Action).

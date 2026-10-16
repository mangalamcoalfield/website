# Mangalam Coalfield — Public Website

Public corporate + knowledge-hub site for **Mangalam Coalfield Private Limited**.
Built with **Astro 7**, **Tailwind CSS v4** and **React** islands, with
**Supabase** for data-driven sections and form capture. Deployed on **Vercel**.

> Separate project from the internal ops app (`app.mangalamcoal.com`) — siblings
> sharing a design language, not one system.

## Stack

- **Astro 7** — static-first (`output: 'static'`), Vercel adapter for the few
  server routes in `src/pages/api/`, sitemap. Node 22.
- **Tailwind CSS v4** via `@tailwindcss/vite`, plus design tokens in
  `src/styles/global.css`.
- **React 18 islands** (`@astrojs/react`) for interactive components in
  `src/components/magic/`.
- **Fonts** — self-hosted via `@fontsource` (Archivo, Hanken Grotesk); no font CDN.
- **Search** — Pagefind, indexed after build.
- **Supabase** — anon/publishable key on the client under RLS; build-time fetch
  for `jobs` / `csr_projects` / `knowledge_entries` / `nci_history`; client-side
  `INSERT` for forms; edge functions in `supabase/functions/` (Deno).

## Local development

```bash
npm ci
cp .env.example .env   # already populated with the public Supabase config
npm run dev            # http://localhost:4321
npm run build          # → .vercel/output (ALLOW_THIN_DATA=1 to build without Supabase data)
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
storage bucket, and a `keepalive` table. Then run `pipeline.sql`,
`abuse_guards.sql` and `hardening_2026_10.sql`, in that order, in the Supabase
SQL editor. Secrets: see `SECRETS.md`.
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

## Not yet wired

- Monthly NCI update (manual one-number or GitHub Action).

-- ============================================================================
-- Mangalam Coalfield — public website schema, RLS & storage
-- Run this in the Supabase SQL editor (project cxxocuprqztejsxqznye).
--
-- Security model (anon / publishable key):
--   • SELECT only PUBLISHED rows in: jobs, csr_projects, knowledge_entries, nci_history
--   • INSERT only into: applications, leads  — and only WITH consent = true
--   • Nothing else. No UPDATE/DELETE/SELECT on applications or leads for anon.
--   • Résumé uploads: anon may INSERT objects into the private `resumes` bucket only.
--
-- "Published" gate:
--   • jobs        → status = 'published'   (the brief's `status` column)
--   • csr_projects, knowledge_entries, nci_history → published boolean (added as a
--     publish gate so editors can stage drafts; all other columns are per the brief)
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ============================================================================
-- TABLES
-- ============================================================================

-- jobs ----------------------------------------------------------------------
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  dept        text,
  location    text,
  type        text,                       -- Full-time / Contract / etc.
  description text,
  status      text not null default 'draft',   -- 'draft' | 'published' | 'closed'
  posted_at   date default current_date,
  created_at  timestamptz not null default now()
);

-- applications --------------------------------------------------------------
create table if not exists public.applications (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  job_id     uuid references public.jobs(id) on delete set null,
  resume_url text,                          -- path/key in the `resumes` bucket
  consent    boolean not null default false,
  created_at timestamptz not null default now()
);

-- csr_projects --------------------------------------------------------------
create table if not exists public.csr_projects (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  category       text,                      -- community | environment | safety
  status         text,                      -- completed | ongoing | planned
  description    text,
  evidence_url   text,
  impact_numbers text,
  date           date,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- knowledge_entries (single table — filter by type/category, do NOT split) ---
create table if not exists public.knowledge_entries (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text,                         -- explainer | reg_link | download
  category    text,                         -- regulation | safety | operations | markets
  slug        text unique,                  -- canonical article URL (explainers)
  body        text,
  source_url  text,
  source_date date,
  file_url    text,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- nci_history ---------------------------------------------------------------
create table if not exists public.nci_history (
  id         uuid primary key default gen_random_uuid(),
  month      text not null,                 -- 'YYYY-MM'
  value      numeric not null,
  sub_index  text,
  source_url text,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

-- leads ---------------------------------------------------------------------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text,
  consent    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful indexes -----------------------------------------------------------
create index if not exists jobs_status_idx          on public.jobs (status, posted_at desc);
create index if not exists csr_published_idx        on public.csr_projects (published, date desc);
create index if not exists knowledge_published_idx  on public.knowledge_entries (published, category);
create index if not exists nci_published_month_idx  on public.nci_history (published, month desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.jobs              enable row level security;
alter table public.applications      enable row level security;
alter table public.csr_projects      enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.nci_history       enable row level security;
alter table public.leads             enable row level security;

-- --- SELECT (anon): published rows only ------------------------------------
drop policy if exists "anon read published jobs" on public.jobs;
create policy "anon read published jobs"
  on public.jobs for select to anon
  using (status = 'published');

drop policy if exists "anon read published csr" on public.csr_projects;
create policy "anon read published csr"
  on public.csr_projects for select to anon
  using (published = true);

drop policy if exists "anon read published knowledge" on public.knowledge_entries;
create policy "anon read published knowledge"
  on public.knowledge_entries for select to anon
  using (published = true);

drop policy if exists "anon read published nci" on public.nci_history;
create policy "anon read published nci"
  on public.nci_history for select to anon
  using (published = true);

-- --- INSERT (anon): applications & leads, only with consent ----------------
drop policy if exists "anon insert applications with consent" on public.applications;
create policy "anon insert applications with consent"
  on public.applications for insert to anon
  with check (consent = true);

drop policy if exists "anon insert leads with consent" on public.leads;
create policy "anon insert leads with consent"
  on public.leads for insert to anon
  with check (consent = true);

-- NOTE: no anon SELECT/UPDATE/DELETE policies exist on applications or leads,
-- so with RLS enabled the anon role cannot read or modify them. Only the
-- service-role key (used server-side / in the dashboard) bypasses RLS.

-- ============================================================================
-- STORAGE — private `resumes` bucket
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- anon may UPLOAD (insert) résumés only; never list/read/update/delete them.
drop policy if exists "anon upload resumes" on storage.objects;
create policy "anon upload resumes"
  on storage.objects for insert to anon
  with check (bucket_id = 'resumes');

-- (No anon SELECT policy on storage.objects for `resumes` → uploads are write-only
--  for the public. HR reads résumés via the dashboard / service role.)

-- ============================================================================
-- KEEP-ALIVE (free-tier hedge) — a tiny table the daily GitHub Action pings
-- so the project never idles into a 7-day pause. Not exposed to anon.
-- ============================================================================
create table if not exists public.keepalive (
  id         uuid primary key default gen_random_uuid(),
  pinged_at  timestamptz not null default now()
);
alter table public.keepalive enable row level security;
-- no anon policies → only the service role (used by the Action) can write/read.

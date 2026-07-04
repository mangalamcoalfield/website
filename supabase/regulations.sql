-- ============================================================================
-- Regulations hub — public, downloadable library of Indian coal-mining
-- regulations. Data-driven; anon may SELECT published rows only (same RLS
-- pattern as jobs/csr/knowledge/nci). Files hosted externally (Hostinger),
-- referenced by download_url. Publish-filter: public-domain government docs
-- only — no internal/DPR content.
-- ============================================================================
create table if not exists public.regulations (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,                 -- clean, human-readable
  category     text not null,                 -- cmr_2017 | mines_act | dgms_circular | dgms_notification | labour_code | mmdr | env_forest | moc | cea | draft
  summary      text,                          -- plain-language summary (SEO/AEO)
  doc_number   text,                          -- e.g. "G.S.R. 640(E)" / "Tech Circular 02/2025"
  authority    text,                          -- DGMS / Ministry of Coal / Ministry of Labour ...
  issued_date  date,
  status       text not null default 'in_force', -- in_force | draft | superseded
  status_note  text,                          -- short clarifier shown by the status badge (e.g. what superseded it)
  source_url   text,                          -- official canonical source
  download_url text,                          -- externally hosted PDF (filled after upload)
  file_size_kb integer,
  tags         text[] default '{}',
  relevance    smallint,                      -- 1 Amlabad-direct · 2 governing · 3 context
  published    boolean not null default false,
  sort_order   integer default 100,
  created_at   timestamptz not null default now()
);

create index if not exists regulations_pub_cat_idx on public.regulations (published, category, sort_order);
create index if not exists regulations_pub_date_idx on public.regulations (published, issued_date desc);

alter table public.regulations enable row level security;
drop policy if exists "anon read published regulations" on public.regulations;
create policy "anon read published regulations"
  on public.regulations for select to anon
  using (published = true);

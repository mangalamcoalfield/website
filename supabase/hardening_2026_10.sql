-- ============================================================================
-- Hardening for the public forms (2026-10)
-- ----------------------------------------------------------------------------
-- Run in the Supabase SQL editor AFTER schema.sql, pipeline.sql and
-- abuse_guards.sql. Idempotent — safe to re-run.
--
-- Problem: the anon role had table-wide INSERT on applications/leads, so a
-- caller holding the (public) anon key could set ANY column, including
--   • created_at — a row stamped far in the future counts towards the
--     guard_insert_rate() window forever ("created_at > now() - 10 min"), so a
--     few dozen such rows lock every real applicant out permanently;
--   • notified_at / resume_purged_at — pre-marking a row as already notified or
--     purged, so HR never hears about it and retention skips it;
--   • details — unbounded jsonb.
--
-- Fix:
--   1) anon may INSERT only the columns the forms actually send
--      (src/components/ApplicationForm.astro, src/components/ContactForm.astro).
--   2) guard_insert_rate() forces created_at := now() and clears
--      notified_at / resume_purged_at on every insert (defence in depth, also
--      covers any other role).
--   3) applications.details exists and is size-capped.
-- ============================================================================

begin;

-- 1) details column (the application form has always sent it) + size cap ------
alter table public.applications add column if not exists details jsonb;

alter table public.applications drop constraint if exists applications_details_size;
-- NOT VALID: enforced for every new/updated row without failing on any
-- oversized junk already present. See the optional clean-up at the bottom.
alter table public.applications
  add constraint applications_details_size
  check (details is null
         or (jsonb_typeof(details) = 'object' and pg_column_size(details) < 16384))
  not valid;

-- 2) Column-level INSERT for anon ------------------------------------------------
-- RLS policies ("... with consent") still apply on top of these grants.
revoke insert on table public.applications from anon;
grant  insert (name, email, phone, job_id, resume_url, details, consent)
  on table public.applications to anon;

revoke insert on table public.leads from anon;
grant  insert (name, email, message, consent)
  on table public.leads to anon;

-- 3) Rate guard: server-controlled timestamps ------------------------------------
-- jsonb_populate_record() only overrides keys that are real columns of the
-- table, so the same trigger works for leads (no notified_at/resume_purged_at)
-- and for applications whether or not pipeline.sql has added those columns.
create or replace function public.guard_insert_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  -- Never trust a client-supplied timestamp or pipeline state.
  new := jsonb_populate_record(new, jsonb_build_object(
           'created_at',       now(),
           'notified_at',      null,
           'resume_purged_at', null));

  execute format('select count(*) from %I.%I where created_at > now() - $1::interval',
                 tg_table_schema, tg_table_name)
     into n using tg_argv[1];
  if n >= tg_argv[0]::int then
    raise exception 'submission_rate_exceeded'
      using errcode = 'P0001',
            hint = 'Too many submissions in a short period; please try again shortly.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_insert_rate() from public, anon, authenticated;

-- (Triggers from abuse_guards.sql already point at this function; recreating
--  the function is enough. Re-asserted here in case abuse_guards.sql was skipped.)
drop trigger if exists applications_rate_guard on public.applications;
create trigger applications_rate_guard
  before insert on public.applications
  for each row execute function public.guard_insert_rate('40', '10 minutes');

drop trigger if exists leads_rate_guard on public.leads;
create trigger leads_rate_guard
  before insert on public.leads
  for each row execute function public.guard_insert_rate('20', '10 minutes');

commit;

-- ============================================================================
-- OPTIONAL clean-up (run by hand after reviewing the results)
-- ----------------------------------------------------------------------------
-- Rows already poisoned with future timestamps keep the rate guard tripped:
--   select id, created_at from public.applications where created_at > now() + interval '1 minute';
--   select id, created_at from public.leads        where created_at > now() + interval '1 minute';
-- If any are junk, delete them (or clamp: update ... set created_at = now() where ...).
--
-- Oversized/non-object details already stored:
--   select id, pg_column_size(details) from public.applications
--    where details is not null
--      and (jsonb_typeof(details) <> 'object' or pg_column_size(details) >= 16384);
-- Once that returns nothing:
--   alter table public.applications validate constraint applications_details_size;
-- ============================================================================

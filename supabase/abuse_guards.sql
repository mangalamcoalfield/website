-- ============================================================================
-- Abuse guards for the public forms (applied 2026-10-10)
-- ----------------------------------------------------------------------------
-- The contact and application forms write straight to Supabase from the
-- browser with the public anon key, so the Vercel rate limiters never see those
-- writes. Without these guards anyone holding the (public) key could insert
-- unlimited rows and upload unlimited files of any type and size, filling the
-- 1 GB storage quota and locking real applicants out of uploading.
--
-- These are database-side ceilings, generous enough never to touch real
-- traffic: the busiest day so far was 62 applications (5 Sep 2026, after the
-- LinkedIn post), i.e. a few per ten minutes at most.
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1) Résumé bucket: 8 MB cap and document/photo types only. The form sets the
--    content type from the file extension, so these must stay in step with
--    RESUME_TYPES in src/components/ApplicationForm.astro. Images are allowed
--    because real applicants have sent photographed résumés.
update storage.buckets
   set file_size_limit    = 8388608,
       allowed_mime_types = array[
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'image/jpeg',
         'image/png'
       ]
 where id = 'resumes';

-- 2) Global insert ceiling for applications and leads. Arguments: max rows,
--    window. Counts every row in the window, whoever inserted it.
create or replace function public.guard_insert_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
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

drop trigger if exists applications_rate_guard on public.applications;
create trigger applications_rate_guard
  before insert on public.applications
  for each row execute function public.guard_insert_rate('40', '10 minutes');

drop trigger if exists leads_rate_guard on public.leads;
create trigger leads_rate_guard
  before insert on public.leads
  for each row execute function public.guard_insert_rate('20', '10 minutes');

-- 3) Résumé upload ceiling, enforced in the storage insert policy itself.
create or replace function public.resume_upload_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select count(*) < 40
    from storage.objects
   where bucket_id = 'resumes'
     and created_at > now() - interval '10 minutes'
$$;
revoke all on function public.resume_upload_allowed() from public;
grant execute on function public.resume_upload_allowed() to anon;

drop policy if exists "anon upload resumes" on storage.objects;
create policy "anon upload resumes"
  on storage.objects for insert to anon
  with check (bucket_id = 'resumes' and public.resume_upload_allowed());

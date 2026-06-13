-- ============================================================================
-- Mangalam Coalfield — careers email/résumé pipeline wiring
-- Run AFTER schema.sql. Safe to run before secrets are added: every call uses a
-- graceful fallback (empty webhook secret, no email transport = no-op).
--
-- Adds: governance columns, pg_net + pg_cron, an INSERT trigger that pings the
-- notify-application edge function, and two daily cron jobs (digest, retention).
-- ============================================================================

-- 1) Governance columns on applications -------------------------------------
alter table public.applications add column if not exists notified_at      timestamptz;
alter table public.applications add column if not exists resume_purged_at timestamptz;

-- 2) Extensions (Supabase installs these into the `extensions` / `cron` schemas)
create extension if not exists pg_net  with schema extensions;
create extension if not exists pg_cron;

-- 3) INSERT trigger → notify-application edge function -----------------------
-- Reads the shared webhook secret from Vault if present (you create it later;
-- see SECRETS section). Until then it sends an empty secret, which the function
-- accepts because WEBHOOK_SECRET is also unset on its side.
create or replace function public.handle_new_application()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'webhook_secret' limit 1;

  perform net.http_post(
    url     := 'https://cxxocuprqztejsxqznye.supabase.co/functions/v1/notify-application',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-webhook-secret', coalesce(v_secret, '')
               ),
    body    := jsonb_build_object('type','INSERT','table','applications',
                 'record', jsonb_build_object('id', NEW.id))
  );
  return NEW;
exception when others then
  -- Never let a notification failure block the application insert.
  raise warning 'handle_new_application: %', sqlerrm;
  return NEW;
end;
$$;

drop trigger if exists on_application_insert on public.applications;
create trigger on_application_insert
  after insert on public.applications
  for each row execute function public.handle_new_application();

-- 4) Daily cron jobs --------------------------------------------------------
-- pg_cron schedules are UTC. Digest 03:00, retention 03:30.
select cron.unschedule('mangalam-application-digest')
  where exists (select 1 from cron.job where jobname = 'mangalam-application-digest');
select cron.unschedule('mangalam-resume-retention')
  where exists (select 1 from cron.job where jobname = 'mangalam-resume-retention');

select cron.schedule('mangalam-application-digest', '0 3 * * *', $job$
  select net.http_post(
    url     := 'https://cxxocuprqztejsxqznye.supabase.co/functions/v1/application-digest',
    headers := jsonb_build_object('Content-Type','application/json',
                 'x-webhook-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name='webhook_secret' limit 1),'')),
    body    := '{}'::jsonb
  );
$job$);

select cron.schedule('mangalam-resume-retention', '30 3 * * *', $job$
  select net.http_post(
    url     := 'https://cxxocuprqztejsxqznye.supabase.co/functions/v1/resume-retention',
    headers := jsonb_build_object('Content-Type','application/json',
                 'x-webhook-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name='webhook_secret' limit 1),'')),
    body    := '{}'::jsonb
  );
$job$);

-- ============================================================================
-- SECRETS (you run these — choose one random value for the webhook secret and
-- use the SAME value in `supabase secrets set WEBHOOK_SECRET=…`):
--
--   select vault.create_secret('<your-random-webhook-secret>', 'webhook_secret');
--
-- This is OPTIONAL but recommended (it stops anyone from calling the functions
-- directly). Without it, the functions still work but are unauthenticated.
-- ============================================================================

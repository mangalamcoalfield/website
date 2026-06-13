// Shared helpers for the careers edge functions.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Service-role client (bypasses RLS). The service key is auto-injected into
 *  every Supabase Edge Function — you never set it manually. Used only here,
 *  server-side; it must never reach the client or git. */
export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Optional shared-secret guard. If WEBHOOK_SECRET is set on the function, the
 *  caller (DB trigger / pg_cron) must send a matching `x-webhook-secret` header.
 *  If unset, calls are allowed (so the plumbing works before secrets are added). */
export function authorized(req: Request): boolean {
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected) return true; // not yet configured → allow (graceful)
  return req.headers.get('x-webhook-secret') === expected;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

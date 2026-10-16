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

/** Shared-secret guard (fail CLOSED). WEBHOOK_SECRET must be set on the
 *  function AND stored in Vault as `webhook_secret` (pipeline.sql sends it as
 *  the `x-webhook-secret` header). If the secret is unset, every call is
 *  rejected — an unconfigured function must never be publicly invokable. */
export function authorized(req: Request): boolean {
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected) {
    console.error('WEBHOOK_SECRET is not set; rejecting request (fail closed). See SECRETS.md.');
    return false;
  }
  const got = req.headers.get('x-webhook-secret') ?? '';
  return timingSafeEqual(got, expected);
}

/** Constant-time string comparison (length leak only). */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const n = Math.max(ab.length, bb.length);
  for (let i = 0; i < n; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

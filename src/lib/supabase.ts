import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Public Supabase client — uses the *publishable / anon* key only.
 * Under RLS the anon role may only:
 *   - INSERT into `applications` and `leads` (with consent)
 *   - SELECT published rows from `jobs`, `csr_projects`, `knowledge_entries`, `nci_history`
 * Nothing else. The secret key never touches this file or any client bundle.
 *
 * Astro exposes only PUBLIC_-prefixed env vars to client code. We read them via
 * import.meta.env so the same module works at build time and in the browser.
 */
const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/** True when the public config is present. Lets pages degrade gracefully. */
export const supabaseConfigured = Boolean(url && anonKey);

let _client: SupabaseClient | null = null;

/** Returns a singleton anon client, or null if env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!_client) {
    _client = createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/* ----------------------------- Row types ----------------------------- */

export interface Job {
  id: string;
  title: string;
  dept: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  status: string;
  posted_at: string | null;
}

export interface CsrProject {
  id: string;
  title: string;
  category: 'community' | 'environment' | 'safety' | string;
  status: 'completed' | 'ongoing' | 'planned' | string;
  description: string | null;
  evidence_url: string | null;
  impact_numbers: string | null;
  date: string | null;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  type: 'explainer' | 'reg_link' | 'download' | string;
  category: 'regulation' | 'safety' | 'operations' | 'markets' | string;
  body: string | null;
  source_url: string | null;
  source_date: string | null;
  file_url: string | null;
  slug?: string | null;
}

export interface NciPoint {
  id: string;
  month: string;
  value: number;
  sub_index: string | null;
  source_url: string | null;
}

export interface Regulation {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  doc_number: string | null;
  authority: string | null;
  issued_date: string | null;
  status: string;
  status_note: string | null;
  source_url: string | null;
  download_url: string | null;
  file_size_kb: number | null;
  tags: string[] | null;
  relevance: number | null;
  sort_order: number | null;
  featured?: boolean | null;
}

/**
 * Escape hatch for the `expectAtLeast` floor below. Set only when a thin result
 * is genuinely correct — a first seed, or a deliberate emptying of a table.
 */
const allowThinData = import.meta.env.ALLOW_THIN_DATA === '1' || process.env.ALLOW_THIN_DATA === '1';

/**
 * Build-time fetch helper. Wraps a Supabase select in a try/catch so a paused
 * or empty free-tier project never breaks the static build — pages fall back to
 * curated placeholder content instead. Returns [] on any failure.
 *
 * `expectAtLeast` guards the case where that graceful fallback is the wrong
 * answer. A transient connection timeout mid-build once returned no rows for
 * the regulations table: getStaticPaths fell back to the single placeholder, so
 * the build emitted 3 regulation pages instead of 316 and still reported
 * success. The hub went on claiming "314 regulations" while every detail link
 * would have 404'd. Silence is the danger — an empty result is indistinguishable
 * from a real one unless something asserts a floor.
 *
 * So: pass `expectAtLeast` on queries that must not come back thin, and a
 * production build fails loudly instead of shipping a hollow site. Dev builds
 * only warn, so working offline still works.
 */
export async function safeSelect<T>(
  fn: (client: SupabaseClient) => Promise<{ data: T[] | null; error: unknown }>,
  opts?: { expectAtLeast?: number; label?: string }
): Promise<T[]> {
  const floor = opts?.expectAtLeast;
  const label = opts?.label ?? 'query';

  const shortfall = (rows: number, why: string): T[] => {
    if (floor === undefined || rows >= floor || allowThinData) return [] as T[];
    const msg =
      `[supabase] ${label} returned ${rows} row(s), expected at least ${floor} (${why}). ` +
      `Refusing to build a site with missing content. If this is genuinely correct, ` +
      `rebuild with ALLOW_THIN_DATA=1.`;
    if (import.meta.env.PROD) throw new Error(msg);
    console.warn(msg + ' [dev build — continuing]');
    return [] as T[];
  };

  const client = getSupabase();
  if (!client) return shortfall(0, 'Supabase is not configured');
  try {
    const { data, error } = await fn(client);
    if (error) {
      console.warn('[supabase] select failed, using fallback:', error);
      return shortfall(0, 'the query errored');
    }
    const rows = data ?? [];
    if (floor !== undefined && rows.length < floor) {
      return shortfall(rows.length, 'fewer rows than expected');
    }
    return rows;
  } catch (err) {
    console.warn('[supabase] select threw, using fallback:', err);
    return shortfall(0, 'the query threw');
  }
}

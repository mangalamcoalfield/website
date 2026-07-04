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
  source_url: string | null;
  download_url: string | null;
  file_size_kb: number | null;
  tags: string[] | null;
  relevance: number | null;
  sort_order: number | null;
}

/**
 * Build-time fetch helper. Wraps a Supabase select in a try/catch so a paused
 * or empty free-tier project never breaks the static build — pages fall back to
 * curated placeholder content instead. Returns [] on any failure.
 */
export async function safeSelect<T>(
  fn: (client: SupabaseClient) => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await fn(client);
    if (error) {
      console.warn('[supabase] select failed, using fallback:', error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn('[supabase] select threw, using fallback:', err);
    return [];
  }
}

import type { APIRoute } from 'astro';
import corpus from '../../../data/statutes-corpus.json';
import type { StatuteDoc } from '../../../lib/statutes';
import { ALIASES } from '../../../lib/provision-lookup';

// Provision-number lookup for /regulations/search: "Regulation 78", "CMR 78",
// "Section 40 Mines Act" go straight to that provision. Full-text search can't do
// this — "78" is in hundreds of pages — so the search page and the bot fetch
// this small index when a query names a provision (see lib/provision-lookup.ts).
export const prerender = true;

export const GET: APIRoute = () => {
  const docs = (corpus as StatuteDoc[]).filter((d) => d.numbered);
  const body = {
    docs: docs.map((d) => ({ s: d.slug, t: d.title, st: d.status, a: ALIASES[d.slug] ?? [] })),
    // [doc index, number, label, heading, anchor]
    p: docs.flatMap((d, i) => d.provisions.filter((p) => p.num).map((p) => [i, p.num.toLowerCase(), p.label, p.title, p.id])),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};

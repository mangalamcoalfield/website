import type { APIRoute } from 'astro';
import corpus from '../../../data/circulars-corpus.json';
import { collectionOf, type CircularEntry } from '../../../lib/circulars';

// Exact circular-number lookup for the Circular Finder. Full-text search treats
// "2 of 2009" as three loose words and ranks "09 of 2009" above it; this index lets
// the finder answer a number query exactly. Every "N of YYYY" / "N/YYYY" pair in
// each reference is listed ("Cir. 40/1959, 33/1962 & Tech. 4/1986" gives three),
// with Roman numerals read too ("II of 2016"). Built statically with the site.
export const prerender = true;

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
function roman(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]], w = ROMAN[s[i + 1]] ?? 0;
    n += v < w ? -v : v;
  }
  return n;
}

export const GET: APIRoute = () => {
  const rows = (corpus as CircularEntry[]).map((c) => {
    const pairs: [number, number][] = [];
    for (const m of (c.ref || '').matchAll(/\b(\d{1,3}|[IVXL]{1,6})\s*(?:of|\/)\s*((?:19|20)\d{2})\b/g)) {
      const n = /^\d/.test(m[1]) ? parseInt(m[1], 10) : roman(m[1]);
      if (n > 0) pairs.push([n, parseInt(m[2], 10)]);
    }
    return pairs.length ? { u: `/regulations/circulars/${c.id}`, r: c.ref, t: c.title, d: c.dept, y: c.year, c: collectionOf(c), p: pairs } : null;
  }).filter(Boolean);
  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};

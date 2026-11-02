import type { APIRoute } from 'astro';
import corpus from '../../../data/circulars-corpus.json';
import { collectionOf, type CircularEntry } from '../../../lib/circulars';

// Exact circular-number lookup for the Circular Finder. Full-text search treats
// "2 of 2009" as three loose words and ranks "09 of 2009" above it; this index lets
// the finder answer a number query exactly. Every "N of YYYY" / "N/YYYY" pair in
// each reference is listed ("Cir. 40/1959, 33/1962 & Tech. 4/1986" gives three),
// with Roman numerals read too ("II of 2016"), and gazette notifications by their
// S.O. / G.S.R. number. Built statically with the site.
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
    const add = (raw: string, y: string) => {
      const n = /^\d/.test(raw) ? parseInt(raw, 10) : roman(raw);
      if (n > 0 && !pairs.some(([a, b]) => a === n && b === +y)) pairs.push([n, parseInt(y, 10)]);
    };
    const ref = c.ref || '';
    // "2 of 2009", "02/2009", "II of 2016", "2. of 1997", "2A of 2007", "12 (Revised) of 2020"
    for (const m of ref.matchAll(/\b(\d{1,3}|[IVXL]{1,6})[A-Z]?\.?\s*(?:\((?:Revised|Rev\.?)\)\s*)?(?:of|\/)\s*(?:of\s*)?((?:19|20)\d{2})\b/g)) add(m[1], m[2]);
    // "Circular No.03 dated 21.08.2024": the year is the date's.
    for (const m of ref.matchAll(/\bNo\.?\s*(\d{1,3})[A-Z]?\b[^,;]{0,15}?\b(?:dated|dt|Dt)\.?\s*\d{1,2}[.\/-]\d{1,2}[.\/-]((?:19|20)\d{2})\b/g)) add(m[1], m[2]);
    // "Circular No. 04" with the year only in the circular's date.
    if (!pairs.length && c.year) {
      const m = ref.match(/\b(?:Circular|Cir\.?)\s*(?:\([^)]{1,25}\)\s*)?No\.?\s*(\d{1,3})[A-Z]?\b/i);
      if (m) add(m[1], String(c.year));
    }
    // Gazette notifications are cited by number alone: "S.O. 841(E)", "G.S.R. 183".
    const g = ref.match(/\b(G\.?\s*S\.?\s*R|S\.?\s*O)\.?\s*(\d{1,4})\b/i);
    const gz = g ? [/^g/i.test(g[1]) ? 'gsr' : 'so', parseInt(g[2], 10)] : undefined;
    return pairs.length || gz ? { u: `/regulations/circulars/${c.id}`, r: c.ref, t: c.title, d: c.dept, y: c.year, c: collectionOf(c), p: pairs, ...(gz ? { g: gz } : {}) } : null;
  }).filter(Boolean);
  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};

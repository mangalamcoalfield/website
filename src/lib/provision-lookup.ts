// Provision-number lookup — "Regulation 78", "CMR 78", "Section 40 Mines Act" —
// shared by the search page (in the browser) and the Ask Mangalam bot (on the
// server), over the index at /regulations/search/provisions.json. Full-text
// search can't answer these: "78" is in hundreds of pages.

/** The names people actually use for the numbered instruments, by library slug. */
export const ALIASES: Record<string, string[]> = {
  'coal-mines-regulations-2017': ['cmr 2017', 'cmr', 'coal mines regulations 2017', 'coal mines regulation'],
  'coal-mines-regulations-1957': ['cmr 1957', 'coal mines regulations 1957'],
  'mines-act-1952': ['mines act', 'act 1952', 'the act'],
  'mines-rules-1955': ['mines rules', 'mines rule'],
  'mines-rescue-rules-1985': ['rescue rules', 'mines rescue'],
  'mines-vocational-training-rules-1966': ['vocational training', 'vt rules', 'mvtr'],
  'mmr-notification': ['mmr 2019', 'metalliferous'],
  'draft-mmr-2018': ['mmr 2018'],
  'the-oil-mines-regulation-2017': ['omr', 'oil mines'],
  'draft-oshwc-coal-mines-regulations-2026': ['osh coal mines regulations', 'oshwc coal mines', 'draft coal mines regulations', 'cmr 2026'],
  'oshwc-code-2020': ['osh code', 'oshwc code', 'osh&wc code', 'occupational safety code'],
  'oshwc-code-central-rules-2026': ['osh rules', 'oshwc rules', 'osh central rules'],
  'code-on-wages-2019': ['wage code', 'code on wages'],
  'code-on-wages-central-rules-2026': ['wages rules', 'wage rules'],
  'industrial-relations-code-2020': ['ir code', 'industrial relations code'],
  'industrial-relations-code-central-rules-2026': ['ir rules', 'industrial relations rules'],
  'code-on-social-security-2020': ['social security code', 'ss code', 'coss'],
  'social-security-code-central-rules-2026': ['social security rules', 'ss rules'],
  'mmdr-act-1957': ['mmdr', 'mmdr act'],
  'mineral-concession-rules-2016': ['mcr', 'concession rules'],
  'mineral-conservation-development-rules-2017': ['mcdr', 'conservation and development rules'],
  'mineral-auction-rules-2015': ['auction rules'],
  'cea-safety-electric-supply-regulations-2023': ['cea', 'cea regulations', 'electricity regulations', 'electric supply regulations'],
};

/** With no document named, a bare "Regulation N" means CMR 2017, "Rule N" the Mines Rules, "Section N" the Mines Act. */
const DEFAULT_DOC: Record<string, string> = { regulation: 'coal-mines-regulations-2017', rule: 'mines-rules-1955', section: 'mines-act-1952' };

/** Shape of provisions.json: docs (slug, title, status, aliases) and rows [doc index, number, label, heading, anchor]. */
export type ProvisionIndex = { docs: { s: string; t: string; st: string; a: string[] }[]; p: [number, string, string, string, string][] };
export type ProvisionMatch = { slug: string; docTitle: string; status: string; label: string; title: string; anchor: string; url: string };

function parse(q: string) {
  const s = q.toLowerCase();
  const m = s.match(/\b(reg(?:ulation)?s?|r|rules?|sec(?:tion)?s?|s|u\/s|para(?:graph)?)\.?\s*(\d{1,3}[a-z]{0,2})\b(?!\s*(?:of|\/)\s*(?:19|20)\d{2})/);
  if (m) {
    const w = m[1];
    const noun = /^reg/.test(w) ? 'regulation' : /^(r|rules?)$/.test(w) ? 'rule' : /^(sec|s$|u\/s)/.test(w) ? 'section' : 'para';
    return { noun, num: m[2], rest: s.replace(m[0], ' ') };
  }
  // "cmr 78", "mines act 40": a known short name followed by a number that isn't a year.
  const b = s.match(/\b([a-z&][a-z& ]{1,40}?)\s+(\d{1,3}[a-z]{0,2})\b(?!\s*(?:of|\/))/);
  return b ? { noun: '', num: b[2], rest: b[1] } : null;
}

/** Whether a query looks like it names a provision (cheap; no index needed). */
export const namesProvision = (q: string) => parse(q) !== null;

/**
 * The provisions a query names, best first. `docTitle` restricts to one document
 * (the search page's Document filter). Returns [] when the query is not a
 * provision lookup ("headgear 2" is not one: no noun and no document named).
 */
export function findProvisions(q: string, idx: ProvisionIndex, docTitle = ''): ProvisionMatch[] {
  const pr = parse(q);
  if (!pr) return [];
  const rest = ` ${pr.rest.replace(/[^a-z0-9& ]/g, ' ').replace(/\s+/g, ' ')} `;
  const named = new Set<number>();
  idx.docs.forEach((d, i) => {
    if (d.a.some((a) => rest.includes(` ${a} `))) named.add(i);
    if (docTitle && d.t === docTitle) named.add(i);
  });
  if (!pr.noun && !named.size) return [];
  const rows = idx.p.filter(([i, n, label]) =>
    n === pr.num && (named.size ? named.has(i) : true) && (!pr.noun || label.toLowerCase().startsWith(pr.noun)));
  const def = DEFAULT_DOC[pr.noun];
  rows.sort((a, b) => {
    const da = idx.docs[a[0]], db = idx.docs[b[0]];
    return Number(db.s === def) - Number(da.s === def) || Number(db.st === 'in_force') - Number(da.st === 'in_force');
  });
  return rows.slice(0, named.size ? 3 : 4).map(([i, , label, title, anchor]) => {
    const d = idx.docs[i];
    return { slug: d.s, docTitle: d.t, status: d.st, label, title, anchor, url: `/regulations/${d.s}/text#${anchor}` };
  });
}

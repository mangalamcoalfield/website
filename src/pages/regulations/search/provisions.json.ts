import type { APIRoute } from 'astro';
import corpus from '../../../data/statutes-corpus.json';
import type { StatuteDoc } from '../../../lib/statutes';

// Provision-number lookup for /regulations/search: "Regulation 78", "CMR 78",
// "Section 40 Mines Act" go straight to that provision. Full-text search can't do
// this — "78" is in hundreds of pages — so the search page fetches this small
// index when a query names a provision. Aliases are the names people actually use.
export const prerender = true;

const ALIASES: Record<string, string[]> = {
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
  // The hosted 'MMDR Act, 1957' PDF is the 2023 Amendment Act; don't answer "section N mmdr" with it.
  'mmdr-act-1957': ['mmdr amendment', 'mmdr amendment act', 'mmdr 2023'],
  'mineral-concession-rules-2016': ['mcr', 'concession rules'],
  'mineral-conservation-development-rules-2017': ['mcdr', 'conservation and development rules'],
  'mineral-auction-rules-2015': ['auction rules'],
  'cea-safety-electric-supply-regulations-2023': ['cea', 'cea regulations', 'electricity regulations', 'electric supply regulations'],
};

export const GET: APIRoute = () => {
  const docs = (corpus as StatuteDoc[]).filter((d) => d.numbered);
  const body = {
    docs: docs.map((d) => ({ s: d.slug, t: d.title, st: d.status, a: ALIASES[d.slug] ?? [] })),
    // [doc index, number, label, heading, anchor]
    p: docs.flatMap((d, i) => d.provisions.filter((p) => p.num).map((p) => [i, p.num.toLowerCase(), p.label, p.title, p.id])),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};

import type { APIRoute } from 'astro';
import corpus from '../../../data/statutes-corpus.json';
import type { StatuteDoc } from '../../../lib/statutes';

// The numbered provisions of one Act / Rules / Regulations, with their text, as
// static JSON. The Ask Mangalam bot fetches this when a question names a
// provision ("What does Regulation 78 say?"), so it answers from the regulation
// itself instead of from the model's memory — which got Regulation 78 wrong.
// Static (CDN-cached), so the 9 MB corpus never goes into the serverless bundle.
export const prerender = true;

export function getStaticPaths() {
  return (corpus as StatuteDoc[]).filter((d) => d.numbered).map((d) => ({ params: { slug: d.slug }, props: { d } }));
}

export const GET: APIRoute = ({ props }) => {
  const d = (props as { d: StatuteDoc }).d;
  const body = {
    title: d.title,
    status: d.status,
    provisions: d.provisions.filter((p) => p.num).map((p) => ({ id: p.id, num: p.num, label: p.label, title: p.title, text: p.text })),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};

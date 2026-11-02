import type { APIRoute } from 'astro';
import seed from '../../data/regulations-full-seed.json';
import { rss } from '../../lib/rss';

// "New in the Regulation Desk": the 60 most recent dated documents in the library
// (DGMS circulars and notifications, gazette rules, drafts), newest first. Built
// with the site, so it changes whenever the library does.
export const prerender = true;

const CAT: Record<string, string> = {
  cmr_2017: 'Coal Mines Regulations 2017', mines_act: 'Mines Act & Rules', dgms_circular: 'DGMS circular',
  dgms_notification: 'DGMS notification', mmdr: 'MMDR Act & Rules', env_forest: 'Environment & Forest',
  labour_code: 'Labour Codes & Rules', cea: 'Electricity (CEA)', moc: 'Ministry of Coal', draft: 'Draft',
};
type Row = { slug: string; title: string; category: string; summary: string | null; issued_date: string | null; status: string; published: boolean };

export const GET: APIRoute = () => {
  const rows = (seed as Row[])
    .filter((r) => r.published && /^\d{4}-\d{2}-\d{2}/.test(r.issued_date || ''))
    .sort((a, b) => b.issued_date!.localeCompare(a.issued_date!))
    .slice(0, 60);
  return rss({
    title: 'Mangalam Regulation Desk — new documents',
    link: 'https://mangalamcoal.com/regulations',
    self: 'https://mangalamcoal.com/regulations/feed.xml',
    description: 'New DGMS circulars, gazette notifications, rules and drafts for Indian coal mining, as they are added to the Mangalam Regulation Desk.',
    items: rows.map((r) => ({
      title: r.status === 'draft' && !/^draft\b/i.test(r.title) ? `Draft: ${r.title}` : r.title,
      link: `https://mangalamcoal.com/regulations/${r.slug}`,
      guid: `mangalam-reg-${r.slug}`,
      date: new Date(`${r.issued_date!.slice(0, 10)}T00:00:00+05:30`),
      category: CAT[r.category] ?? r.category,
      description: r.summary || r.title,
    })),
  });
};

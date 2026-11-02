import type { APIRoute } from 'astro';
import watch from '../../data/draft-watch.json';
import { rss } from '../../lib/rss';

// Draft-Watch as a feed: one item per draft, settlement or pending change being
// tracked. An item's id includes its status and stage, so a reader shows it again
// when either changes; re-checks that change nothing don't re-announce it.
export const prerender = true;

type Item = { title: string; status: string; when: string; note: string; href?: string };

export const GET: APIRoute = () => {
  const { reviewed, items } = watch as { reviewed: string; items: Item[] };
  const date = new Date(`${reviewed}T00:00:00+05:30`);
  return rss({
    title: 'Mangalam Regulation Desk — Draft-Watch',
    link: 'https://mangalamcoal.com/regulations#tracker',
    self: 'https://mangalamcoal.com/regulations/draft-watch.xml',
    description: 'Draft rules, regulations and wage settlements affecting Indian coal mining, and where each stands.',
    items: items.map((i) => ({
      title: `${i.title} — ${i.status}`,
      link: i.href ? new URL(i.href, 'https://mangalamcoal.com').href : 'https://mangalamcoal.com/regulations#tracker',
      guid: `draft-watch|${i.title}|${i.status}|${i.when}`,
      date,
      category: i.status,
      description: `${i.when}. ${i.note}`,
    })),
  });
};

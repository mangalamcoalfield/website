// A minimal RSS 2.0 writer for the Regulation Desk feeds (no dependency needed).
export type FeedItem = { title: string; link: string; guid: string; date: Date; description: string; category?: string };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function rss(o: { title: string; link: string; self: string; description: string; items: FeedItem[] }) {
  const items = o.items.map((i) => `
    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="false">${esc(i.guid)}</guid>
      <pubDate>${i.date.toUTCString()}</pubDate>${i.category ? `
      <category>${esc(i.category)}</category>` : ''}
      <description>${esc(i.description)}</description>
    </item>`).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(o.title)}</title>
    <link>${esc(o.link)}</link>
    <atom:link href="${esc(o.self)}" rel="self" type="application/rss+xml"/>
    <description>${esc(o.description)}</description>
    <language>en-in</language>
    <lastBuildDate>${(o.items[0]?.date ?? new Date()).toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

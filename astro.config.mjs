import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Static-first build. Pages are prerendered to HTML on Vercel and keep serving
// even if the (free-tier) Supabase project is paused. Data-driven sections
// (jobs / csr / knowledge / nci) are fetched at build time with a graceful
// fallback; forms submit client-side via the public anon key under RLS.
export default defineConfig({
  site: 'https://mangalamcoal.com',
  output: 'static',
  integrations: [sitemap()],
  adapter: vercel({
    webAnalytics: { enabled: false },
  }),
  build: {
    inlineStylesheets: 'auto',
  },
});

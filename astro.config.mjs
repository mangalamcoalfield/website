import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import circularRedirects from './src/data/circular-redirects.json' with { type: 'json' };

// Circular pages keep the id they were first published under (tools/build_circular_corpus.py);
// the few that changed point to their new page, or to the finder if the entry is gone.
const redirects = Object.fromEntries(Object.entries(circularRedirects).map(([from, to]) => [
  `/regulations/circulars/${from}`,
  { status: 301, destination: to ? `/regulations/circulars/${to}/` : '/regulations/search/?scope=circulars' },
]));

// Static-first build. Pages are prerendered to HTML on Vercel and keep serving
// even if the (free-tier) Supabase project is paused. Data-driven sections
// (jobs / csr / knowledge / nci) are fetched at build time with a graceful
// fallback; forms submit client-side via the public anon key under RLS.
//
// [magic-ui-experiment branch only] React islands + Tailwind v4 are added so
// 21st.dev Magic-generated components run live on /magic-preview. NOT for main.
export default defineConfig({
  site: 'https://mangalamcoal.com',
  output: 'static',
  redirects,
  integrations: [
    // Keep the password-gated admin view and the staff webmail redirect out of
    // the sitemap — neither is a page the public should be landing on from
    // search, and there is no reason to advertise the admin URL to crawlers.
    sitemap({ filter: (page) => !page.includes('/admin/') && !page.includes('/mail') }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel({
    // Cookieless, aggregate page views (switch on under the project's Analytics tab in Vercel).
    webAnalytics: { enabled: true },
  }),
  build: {
    inlineStylesheets: 'auto',
  },
  // A per-page CSP <meta> with a hash for every inline script, so script-src needs no
  // 'unsafe-inline'. Browsers enforce it on top of the header in vercel.json (which
  // can't know the hashes). Styles keep 'unsafe-inline': React islands set style attributes.
  security: {
    csp: {
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'", 'https://www.googletagmanager.com'] },
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
});

import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

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
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel({
    webAnalytics: { enabled: false },
  }),
  build: {
    inlineStylesheets: 'auto',
  },
});

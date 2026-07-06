# Mangalam Coalfield — Launch Audit (updated 2026-07-06)

Live: **mangalamcoal.com** (Vercel) + staging **mangalam-website.vercel.app**.

## ✅ Done & live
- **Domain** on Vercel (apex + www serving; SSL auto-issued). Email routing untouched.
- **docs.mangalamcoal.com** — branded landing + the regulation PDF host.
- **Regulations** — 452 downloadable docs (accuracy-checked), DGMS Circular Finder, Latest-from-DGMS + Draft-Watch trackers.
- **Learn** — 5 substantive explainers; coking NCI tracker.
- **Careers** — 9 real openings + department tabs (Mining/Mechanical/Admin; Electrical auto-appears) + **role-aware application form** (department-specific questions → saved to `applications.details`).
- **About** — chairman portrait (blue-bg) + exact Chairman-Emeritus quote; four-pits photo.
- **Operations** — headframe photo + "how the coal is mined".
- **Employee Mail** — branded `/mail` gateway + header mail icon; Operations Portal rename.
- **Forms** — save to Supabase (DPDP consent); `/api/notify` email + weekly-Excel cron **built** (dormant until env vars added).
- **Polish** — hero descender fix, dropdown contrast fix, themed arrows (no blue emoji), favicon + apple-touch-icon + 1200×630 OG image, clean bot probe, home ticker removed.
- **SEO** — canonical, sitemap, robots, llms.txt, JSON-LD (Organization/JobPosting/Article/Legislation).

## ⏳ Pending YOUR action (dashboards/DNS — no development needed)
1. **Vercel env vars** (Settings → Environment Variables → redeploy):
   - Notifications: `SMTP_HOST` `smtp.hostinger.com` · `SMTP_PORT` `465` · `SMTP_USER` `noreply@mangalamcoal.com` · `SMTP_PASS` *** · `NOTIFY_TO` `hr@mangalamcoal.com`
   - Weekly Excel: `SUPABASE_SERVICE_KEY` *** (Supabase → Settings → API → service_role) · `CRON_SECRET` *** (any random string)
2. **Set `mangalamcoal.com` as Primary** in Vercel (www → apex; matches canonical).
3. **Apex "Invalid" in Vercel** → click Refresh; if still red, delete the leftover `AAAA` (IPv6) record in the DNS zone.
4. **careers redirect** → DNS `CNAME careers → cname.vercel-dns.com` + Vercel add `careers.mangalamcoal.com` → Redirect to `https://mangalamcoal.com/careers`.
5. **mail.mangalamcoal.com** (optional) — `/mail` already works; only needed if you want the branded subdomain.
6. Remove the **old careers portal** website from Hostinger (moved to a temp domain).

## 📝 Needs YOUR input / content (can't be invented)
1. **Founder / company story** — About "Our story" is still placeholder; you mentioned a fuller story + "another plan."
2. **Leadership bios** — 3 placeholder profile cards (names, titles, bios, photos).
3. **Mangalam Cares (CSR)** — 4 placeholder projects; real what/where/when + evidence. (You said: resolve at the end.)
4. **Contact details** — no phone; registered office is just "Kolkata." Need phone + full registered address + **CIN**.
5. **Home stat claims** — "200+ workforce", "100% DGMS statutory positions filled", "4 pits under revival" — confirm accurate or I soften.
6. **Location wording** — careers portal says **Bokaro**; site says **Eastern Jharia, Jharkhand**. Which is correct? I'll standardize everywhere.
7. **Webmail URL** — confirm `mail.hostinger.com` is your webmail (vs Titan `mail.titan.email`).

## 🔨 To develop together (decisions / features)
1. **Weekly Excel** — confirm/edit the role-specific questions; test-run once env vars land.
2. **Home ticker** — leave off, or add a real "Latest from DGMS / regulatory updates" strip, or a mining-news feed.
3. **Applications admin** — the weekly Excel has 14-day résumé links; optionally a small protected dashboard to review/manage applications live.
4. **Legal footer** — CIN + registered office + optional Terms/Disclaimer.
5. **Analytics** — add GA4 or Plausible if you want traffic data.

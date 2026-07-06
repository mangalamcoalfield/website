# Mangalam Coalfield — Pre-Launch Audit (2026-07-05)

Target: go live on the main domain **mangalamcoal.com**. Ordered by launch priority.

## 🔴 Blockers (must fix to go live)
1. **Main domain not connected.** `mangalamcoal.com` + `www` return nothing (only `app.` and `docs.` subdomains resolve). Add both to Vercel + set DNS at registrar. Site code already configured for it (canonical/sitemap/robots = mangalamcoal.com).
2. **Forms have no notification.** Contact + application forms save to Supabase (`leads`, `applications`) with DPDP consent, but send **no email** (`HOOK: email notification … wire in here later`). Enquiries/applications land silently in the DB. Needs email/webhook notification or a monitoring plan.

## 🟠 High — content & accuracy
3. **Placeholder content live:**
   - **About** — founder/company story, leadership bios, Chairman Emeritus portrait ("to be supplied").
   - **Careers** — 3 seeded placeholder roles ("Placeholder posting"). Pull real roles from careers.mangalamcoal.com.
   - **Cares** — 4 generic placeholder CSR projects (no evidence/numbers). [Deferred — resolve last per owner.]
4. **Home stat claims need owner sign-off:** "200+ workforce", "100% DGMS statutory positions filled", "4 pits under revival" (`MagicSections.tsx` stats). Confirm accurate or soften.
5. **Contact info thin:** no phone; registered office just "Kolkata". Add phone, full registered address, CIN.

## 🟡 Medium — polish (I can do)
6. **Favicon** = logo PNG → add proper favicon.ico + apple-touch-icon.
7. **OG/social image** = logo → add 1200×630 branded share image + twitter:card=summary_large_image.
8. **Bot console 400** — Ask-Mangalam widget fires one bad request on load (bot works via POST). Clean up.
9. **Footer legal** — add CIN + registered office; consider Terms/Disclaimer alongside the existing Privacy notice.

## ✅ Verified good
All 9 pages 200; 404 works; sitemap/robots/llms present; canonical = mangalamcoal.com; JSON-LD (Organization/JobPosting/Article/Legislation); **bot answers accurately with sources**; responsive/themed; Regulations + Learn overhauled; subdomains `app` + `docs` live; forms wired to Supabase with consent.

## Assets received from owner (2026-07-06), to wire in
- Chairman photo (white-bg version → About portrait; blue-bg version as backup).
- Two Amlabad headframe drone photos → candidates for Operations/About/home.
- Careers: real roles to come from careers.mangalamcoal.com (owner to confirm which are open).
- Chairman description/quote: pull from current mangalamcoal.com.

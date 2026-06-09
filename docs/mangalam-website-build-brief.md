# Mangalam Coalfield — Website Build Brief (for Claude Code)

**Purpose:** Build the new public corporate + knowledge-hub website for Mangalam Coalfield Private Limited, replacing the old WordPress/Hostinger site. This is a *separate* project from the internal ops app (`app.mangalamcoal.com`) — siblings sharing a design language, not one merged system.

**Design reference:** The approved static draft (`mangalam-draft.html`) is the visual spec. Match its look exactly, then componentise it properly. The draft is a single static mockup; this brief is the real, multi-page, data-driven build.

---

## 1. Stack & hosting

- **Framework:** Astro (content-first, ships minimal JS; add islands only where interactivity is needed). Styling via Tailwind (configure the tokens below) or CSS variables — your call, but reproduce the approved design precisely.
- **Repo:** New GitHub repo, **separate** from the ops app repo.
- **Hosting:** Vercel. Build and iterate on the free `*.vercel.app` preview URL first (this is "staging"). Point `mangalamcoal.com` at Vercel only when approved.
- **Fonts:** Self-host (Fontsource or local) — do **not** rely on the Google Fonts CDN. Display = **Archivo** (600/700); Body = **Hanken Grotesk** (400/500/600).
- **Mobile-first:** One responsive build for phone/tablet/desktop. The workforce and most Indian users are phone-first.

## 2. Backend — Supabase (IMPORTANT billing detail)

- Create the website's Supabase project in a **separate, FREE-plan organization** — NOT inside the ops app's Pro org. (Org-level billing: a project in the Pro org would add ~$10/mo; a project in its own free org is $0.)
- Free projects pause after 7 days of inactivity. Hedge it two ways: (a) the site is static-first so Astro pages keep serving from Vercel even if Supabase sleeps; (b) add a free daily keep-alive ping (GitHub Action inserting one row) to prevent pausing.
- RLS throughout. Public anon role may only: `INSERT` into `applications` and `leads` (with consent), and `SELECT` published `jobs`/`csr_projects`/`knowledge_entries`/`nci_history`. Nothing else.

### Data model (tables)
- `jobs` — title, dept, location, type, description, status, posted_at
- `applications` — name, email, phone, job_id, resume_url, consent, created_at
- `csr_projects` — title, category (community/environment/safety), status (completed/ongoing/planned), description, evidence_url, impact_numbers, date
- `knowledge_entries` — title, type (explainer/reg_link/download), category (regulation/safety/operations/markets), body, source_url, source_date, file_url  *(single table, filtered by type/category — do not split)*
- `nci_history` — month, value, sub_index, source_url
- `leads` — name, email, message, consent, created_at

## 3. Design system (LOCKED)

**Palette (hex):**
- Base black `#000000`; near-black `#0b0e0b`; panel `#0f130f`
- Forest `#15301f` / darker `#102619`
- Lime `#aecf3e` (accent ONLY); lime-soft `#bcd25f`
- Teal `#5e9a89`
- Cream `#f5f5f1` / `#ebece5`
- Text on dark `#e9eae4`, muted `#8d938b`; on light `#171b16`, muted `#5b635b`
- Hairlines: `rgba(255,255,255,.09)` (dark) / `rgba(20,24,20,.10)` (light)

**Lime discipline (this is what makes it clean):** lime appears only as small accents — the chevron in eyebrows, a single underline on one hero word, primary buttons, list ticks, small stat units, hover states. **Never** big bright fills. Stat numbers are cream, not lime.

**Logo:** use the real `mangalam_logo.png` (provided) placed in `/public`, shown on black/dark backgrounds (its background is pure black). Do **not** recreate it in SVG. The chevron shape may be reused as a subtle eyebrow motif (see draft).

**Motion (calm):** gentle fade-up reveals via IntersectionObserver; staggered hero reveal on load; sticky nav gains a blurred-dark background on scroll; subtle hover lifts. Respect `prefers-reduced-motion`. No grain overlay, no glows beyond a whisper.

**Section rhythm:** alternate theme colours — black hero → near/forest stats → cream operations → forest safety → near legacy → cream knowledge → near/black cares → black careers → near footer.

## 4. Pages & content structure

Multi-page (home composed of teaser sections linking out):
1. **Home** — hero, stats, two business lines, capabilities, + teasers for safety / legacy / knowledge / cares, careers CTA.
2. **About / Leadership** — company story; **Chairman Emeritus** tribute to **Late Shree Gopal Agarwal** (portrait photo slot — asset to be supplied) with the legacy theme (rich legacy, resilience, shared values; new generation upholding trust, integrity, excellence); current leadership.
3. **Operations & Capabilities** — the two business lines (below) + capabilities (Mine Development, Underground Operations, Electrical & Mechanical, Statutory Compliance).
4. **Safety & Compliance** — DGMS focus, statutory positions, registers, gas/ventilation, medicals. (Differentiator.)
5. **Learn / "How Coal Mining Works"** — knowledge hub, data-driven from `knowledge_entries`; embed YouTube where relevant; host canonical articles here for SEO.
6. **Mangalam Cares** — CSR + environmental sustainability, data-driven from `csr_projects`; completed (with evidence) vs planned (labelled).
7. **Careers** — data-driven from `jobs`; application form → `applications`; add **JobPosting schema** markup (Google for Jobs). Replaces the old stale blog format. 301 the `careers.` subdomain → `/careers`.
8. **Contact** — form → `leads`.
9. **Employee Portal** — button linking to `https://app.mangalamcoal.com`.

### Two business lines (categorise clearly)
- **Coal Mining** — reviving the historic Amlabad pits in **Eastern Jharia, Jharkhand**: **Pit No. 1, 2, 3, and 4** (all four) in revival/development/dewatering. Positioning: "powering India's industrial growth through responsible coal."
- **Coal Bed Methane (CBM)** — commercially capturing methane held within the same coal seams; a cleaner energy stream put to use rather than vented. (New commercial vertical.)

## 5. Integrations

- **Forms** (contact, careers application, lead): write to Supabase with a **DPDP consent checkbox** in each flow.
- **Resume handling:** store in Supabase Storage; email a per-application notification to `hr@mangalamcoal.com` *immediately* (don't gate first-sight on a threshold); send a scheduled **consolidated digest of application metadata** (name/role/date/link — pure SQL, no AI); retention = forward → confirm delivery → then purge, with a short grace window. **AI summarisation of resume *content* is out of automated scope** (done manually, end-of-day, via the owner's Claude Max — keeps candidate PII off any free tier that trains).
- **Email transport:** Hostinger email hosting SMTP (mailbox `hr@mangalamcoal.com` exists). If edge-function SMTP is unreliable, fall back to **Resend free tier** (still sending from the domain). Configure **SPF/DKIM**.
- **"Ask Mangalam" bot:** zero-runtime-cost design — **client-side retrieval** over a precomputed JSON of vetted content (e.g. Fuse.js or a small client-side embeddings search); lead capture via the form, not the chat. *(Optional later upgrade:* a generative bot on **Gemini Flash free tier** via an edge function with the key server-side, RAG over vetted content only, refusing out-of-scope, making zero commitments, rate-limited, spend-capped. **Public content only on the free tier** — its inputs may be used for training.)*
- **NCI ticker:** the National Coal Index is published **monthly** (PDF) by the Ministry of Coal at `coal.nic.in`. Update `nci_history` monthly — manual one-number update is fine, or a free monthly GitHub Action. Display latest value + simple trend. (It's a monthly index, not a live price.)
- **Milestone stats:** static, curated, deliberately updated figures (cumulative/operational facts) — **never** a live ops-data feed and **never** a live safety/days-since-incident counter.

## 6. Publish-filter discipline (NON-NEGOTIABLE)

Only content already public through an official channel goes live.
- Amlabad project content: lean on the **Environmental Clearance / EIA / EMP / public-hearing records** (PARIVESH/MoEFCC) and the company's own public site. Vet public figures against internal data **for accuracy only — never to enrich a public figure** (that would leak internal data).
- **No** confidential DPR contents (reserves, geology, mine-plan economics, production schedules), **no** site-specific gas/methane readings, **no** internal production data. Teach methane as *science* in the hub; CBM as a *business line* in general terms.
- CSR: showcase **Mangalam's own** contributions only (not BCCL's reclamation); completed work with evidence, planned clearly labelled.
- Knowledge bank: **curated plain-language explainers + version-dated links to canonical sources** (DGMS, Ministry of Coal, Coal Mines Regulations 2017, Mines Act) — not a re-hosted PDF graveyard. Scope = **Indian coal: regulation, safety, operations**, with occasional international tech as deliberate editorial.

## 7. Assets to supply
- Real logo PNG (have).
- **Portrait photo of Late Shree Gopal Agarwal** (Chairman Emeritus) — for the legacy section.
- Real, non-sensitive operations photography (pits, equipment, site).
- Curated public figures for the milestone stats.

## 8. Build sequence
1. Lock design tokens; build Astro skeleton on the free Vercel URL.
2. Create the WEB Supabase project (separate free org) + the tables above + RLS.
3. Build static pages with real (or placeholder→real) content; kill every placeholder before launch.
4. Build the data-driven sections (careers, cares, knowledge hub) reading from Supabase.
5. Build forms (+ consent), resume pipeline (email + digest + retention), NCI widget.
6. Build the "Ask Mangalam" client-side retrieval bot.
7. Load knowledge-hub content and the "How Coal Mining Works" canonical articles.
8. DNS cutover: point apex + www at Vercel (Hostinger stays **registrar** — just change DNS; cancel the WordPress *hosting* plan only after cutover); 301 `careers.` → `/careers`.
9. Curated milestone stats + final visual polish.
10. Before importing any sensitive data anywhere: confirm RLS and review.

---

*This brief is the consolidated spec from the planning sessions. Content (page copy, knowledge articles, CSR write-ups, public-data compilation) is being authored in parallel via Cowork and will land as MDX in the repo or rows in Supabase.*

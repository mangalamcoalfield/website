# Mangalam Coalfield — Website Gap Report

**Audited:** 2026-06-13 · live site `https://mangalam-website.vercel.app` vs the content brief and `content/*.md` drafts.
**Status legend:** ☐ open · ◐ in progress · ☑ done. Update the Status column over time.

> **Headline finding:** the live site is still the **earlier placeholder build**. The full knowledge-hub articles and the revised page copy already drafted in `content/*.md` have **not been deployed**. Most P0 items below are "wire the existing drafts in + remove leftover placeholders," not "write new content." Resolver tags: **DEV** = Claude Code build step · **ME** = you/your records · **PUBLIC** = official public source · **ASSET** = a file to supply.

---

## Per-page diagnosis

**Home** — Real & publish-safe: hero, two business lines, capabilities, all section teasers. Gaps/risks: stat band still shows **"200+ Workforce"** (unverified placeholder number) and lacks the revised "Est. 2024" stat; "100% DGMS positions" is fine (you confirmed). Footer line **"CIN and statutory details to follow"** shows site-wide.

**About / Leadership** — Real & publish-safe: hero, "Our story", values (Trust/Integrity/Excellence). **Three visible placeholders**: (1) story paragraph ends "*(Placeholder copy — the full company history will be filled in…)*"; (2) portrait frame "*Portrait of Late Shree Gopal Agarwal — to be supplied —*"; (3) a whole **Leadership** section of three "*Profile and bio to be supplied*" cards. You chose to **omit named leadership for now** — this section should be hidden, not stubbed.

**Operations** — Strong, full, publish-safe. No placeholders. Minor: Pit No. 2 is labelled "Development" but you confirmed **"under redevelopment"**; pit labels otherwise match.

**Safety** — Strong, full, publish-safe. Correctly states the science is taught publicly and **site-specific readings are never published**. No placeholders. No action beyond a light wording check (below).

**Learn (hub)** — Hub page is good. **NCI widget shows a hard number — "148.4 · Apr 2026 · ▲1.3 · Non-coking all-India"** — this must be verified against the Ministry of Coal release or it is a fabricated figure. Article cards present.

**Learn — 4 articles** — All four are **stubs/broken** while full ~700–1000-word drafts sit ready in `content/knowledge-hub/`:
- Bord & pillar → stub ("*Placeholder explainer…*").
- Mine gas & methane → stub (intro line only).
- Coal grades & NCI → stub (intro + source link only).
- DGMS & rules → **internal page `/learn/dgms-and-the-rules-of-the-mine` is empty/404**, yet Home links to it; the Learn list instead points the card to the external `dgms.gov.in`. Broken internal link + un-hosted article.

**Mangalam Cares** — Publish-safe, no bracket placeholders. Gaps: **Completed** items (Community welfare; Skill & safety training) carry **no evidence and no impact numbers** — brief requires "completed = with evidence." Also **Planned items render before Completed** (ordering reads oddly).

**Careers** — Form is solid (DPDP consent + privacy link). Gap: all three roles are **dummy "Placeholder posting"** entries. Either real postings or the empty-state copy from the draft.

**Contact** — Clean and publish-safe: operations, registered office (Kolkata), email, DPDP consent. Matches the "email + locations only" decision. No placeholders.

**Privacy notice** (site-wide, both forms depend on it) — Exists, reasonable structure, but opens "*Placeholder notice — to be reviewed and finalised by the company before launch.*" Must be **finalised/legally signed off** because the form consents rely on it.

**Publish-filter check (good news):** nothing on the live site strays into confidential territory — no reserves/DPR, no production figures, no site-specific gas readings; methane is handled as science and CBM in general terms. The only filter risks are the **unverified "200+" workforce** stat and the **NCI number** (must trace to a public source).

---

## Prioritised checklist (order = what blocks public launch first)

### P0 — Blocks public launch (visible placeholders, broken, or legally required)

| # | Page | What's needed | Resolver | Status |
|---|------|---------------|----------|--------|
| 1 | Learn / articles | Deploy the 4 full drafts from `content/knowledge-hub/` (bord-and-pillar, ventilation-methane, coal-grades-nci, dgms-regulation) to replace the stubs | DEV (content ready) | ☐ |
| 2 | Learn / DGMS | Fix broken link: Home points to internal `/learn/dgms-and-the-rules-of-the-mine` which is empty. Either host the DGMS article (draft exists) or make all DGMS links go to the same place | DEV | ☐ |
| 3 | About | Remove the visible "*(Placeholder copy…)*" line; replace story with the drafted About copy (`content/pages/02-about-leadership.md`) | DEV (content ready) | ☐ |
| 4 | About | Hide the Leadership section (3 "bio to be supplied" cards) until real bios exist — per the "omit for now" decision; don't stub it | DEV | ☐ |
| 5 | About | Remove the empty portrait frame "— to be supplied —"; section should read complete without a photo until the asset arrives | DEV + ASSET | ☐ |
| 6 | Careers | Replace 3 "Placeholder posting" roles with real postings, or show the empty-state copy ("not advertising open roles at the moment…") | ME / DEV | ☐ |
| 7 | Home | Resolve "200+ Workforce" stat — supply a verified, publication-approved figure or drop it (revised draft uses 4 pits / 2 lines / 100% / Est. 2024) | ME | ☐ |
| 8 | Learn / NCI | Verify the NCI widget value (148.4, Apr 2026, non-coking) against the Ministry of Coal monthly release; correct or replace. Confirm who updates it monthly | PUBLIC + ME | ☐ |
| 9 | Privacy | Finalise the privacy notice and remove the "Placeholder notice…" line — form consents legally depend on it | ME (company/legal) | ☐ |
| 10 | Site-wide footer | Replace/remove "CIN and statutory details to follow" — CIN is public (U05101WB2024PTC267785); confirm wording you want | ME / DEV | ☐ |

### P1 — Quality & consistency (fix before launch, not strictly blocking)

| # | Page | What's needed | Resolver | Status |
|---|------|---------------|----------|--------|
| 11 | Cares | Add evidence photo + a real impact figure + date to each **Completed** item, or relabel — brief requires completed = with evidence | ME + ASSET | ☐ |
| 12 | Cares | Re-order so Completed items show before Planned | DEV | ☐ |
| 13 | Operations | Change Pit No. 2 label "Development" → "Redevelopment" (you confirmed) | DEV | ☐ |
| 14 | Home | Add "Est. 2024" stat from revised draft; align pit-stat label with the four-pit phrasing | DEV | ☐ |

### P2 — Verification & launch mechanics

| # | Page | What's needed | Resolver | Status |
|---|------|---------------|----------|--------|
| 15 | Contact / Operations | Confirm location wording (Bokaro/Chandankiyari vs Eastern Jharia) for footer/contact consistency | ME | ☐ |
| 16 | Careers | Confirm JobPosting schema markup is emitted (Google for Jobs); set up 301 from old `careers.` subdomain → `/careers` | DEV | ☐ |
| 17 | Safety | Light wording check: "safety officer … for every district" — confirm phrasing matches statutory thresholds (defensible as positioning, but verify) | ME | ☐ |
| 18 | Site-wide | Canonicals point to `mangalamcoal.com` — correct for SEO, but confirm the DNS cutover plan before relying on them | DEV | ☐ |

### Assets still needed
| Asset | For | Status |
|-------|-----|--------|
| Portrait of Late Shree Gopal Agarwal | About legacy section (#5) | ☐ |
| Non-sensitive operations/equipment/site photos | Operations, Cares, About | ☐ |
| Curated public stat figures (e.g. verified workforce) | Home stat band (#7) | ☐ |
| CSR evidence photos + impact figures + dates | Cares Completed items (#11) | ☐ |

### Factual checks against an official public source
- **NCI value/series** → Ministry of Coal, `coal.nic.in` (#8).
- **CIN / registered office** → MCA public register (CIN U05101WB2024PTC267785) (#10).
- **Confirmed already:** "100% DGMS statutory positions filled" (your sign-off); Pit No. 2 = redevelopment; **no Amlabad EC content** anywhere (verified absent from live site).

---

## Notes
- This report is diagnosis only — no site or draft files were rewritten.
- Most P0 work is a **deploy/build step** (the substantive content already exists in `content/`), plus removing leftover placeholders and one broken link.
- Cross-reference: open inputs from you are tracked in `content/OPEN-QUESTIONS.md`; this report supersedes it for launch sequencing.

# Regulation Desk: open work and standing rules

For whoever picks up the website next (a person or a Claude session). Kept current
by the session that changes things; newest first within each list.

## Standing rules

- **Nothing goes live without the owner's OK**: production SQL, function deploys,
  fast-forwarding `main`, DNS, uploads to docs.mangalamcoal.com, deletions. Work
  happens on `main-l3efey`; `main` is what Vercel deploys.
- **Never change a slug or a circular id**: they are page addresses. Fix titles,
  numbers and text instead. A changed circular id gets a redirect
  (`src/data/circular-redirects.json`, written by the corpus builder).
- **The seed JSON is the source of truth for the library**
  (`src/data/regulations-full-seed.json`); regenerate the SQL with
  `node tools/gen_regs_sql.mjs`, and put changes for the live table in a dated
  `supabase/regulations_<month>_….sql`.
- **Statuses** (`src/lib/status.ts`): `in_force`, `notified` (final text, in force
  later; the date goes in `status_note`), `draft`, `superseded`. Lists show them in
  that order: what is law today first.
- **Personal data never goes into the corpus**: `tools/pii.py` strips e-mails,
  +91 mobiles and the DGMS officers' telephone directory; exam call letters,
  rejection lists and certificate lists (they name people) stay unpublished.
- **Machine-read text is labelled as such**; a scan scoring under 0.7
  (`tools/ocr_quality.py`) says "Poor scan — read the PDF" and stays out of search.
- **Draft-Watch links must resolve**: the regulations page build fails if an item
  links to a library entry that isn't published.
- **The repository is public**: no personal e-mail addresses, credentials or
  applicant data in commits.

## Open work

| What | Who | Notes |
|---|---|---|
| Live SQL for the 4 Nov corrections | owner OK, then desktop | `supabase/regulations_nov2026_draftwatch.sql` (Assistant Manager notification, Van Rules, Colliery Control Second Amendment). Not applied yet. |
| NCWA-XII Draft-Watch source | desktop | The IndustrialPunch link 404s; find the article's current URL (or another source) and update `src/data/draft-watch.json`. |
| New DGMS documents since 31 Aug 2026 | desktop | BME exam notice of 8 Oct (offline exemption-basis certificate applications) to add; Safety Day notice skipped; Hindi texts of the Mines Act and OSH&WC Code await the owner's decision. |
| "Latest from DGMS" is behind | desktop | Newest DGMS document in the library is dated 31 Aug 2026. Run `tools/discover_dgms.mjs`, add what is new (seed + hosted PDF + SQL), and set `dgms_checked` in `src/data/desk-checks.json` to the date checked, even if nothing was new. |
| Draft-Watch review | desktop | Re-check every item against its source; update `reviewed` in `src/data/draft-watch.json`. NCWA-XII has no library document, only a press source, which is expected. |
| Orphaned résumé | owner | One résumé file with no application (uploaded 5 Sep 2026) reaches the 90-day limit on 4 Dec 2026. Decide: contact the person, or remove `ORPHAN_DRY_RUN` so the daily job deletes it. |
| CMR 1957 regulation 36 | desktop | Missing from the PDF we hold; needs a second copy to settle. Regulations 149 and 201 appear as omitted (* * *). |
| MMDR Act, 1957 PDF | owner | The hosted "MMDR Act, 1957" is the 2023 Amendment Act; the page says so. Needs the principal Act's PDF. |
| Hindi summaries | owner decision | A pilot of Hindi summaries for the most-used CMR 2017 regulations is ready to do on request; translations of legal text need a human check. |
| Old exposures in git history | owner decision | The FTP credential (commit 32f0744) and officers' e-mail addresses (16 Oct corpus commits) are still in the public history. Rewriting it is the owner's call. |
| Four remaining dead source links | — | `cmr-2017-02-sep` (unpublished), the CBT-2020 notification, Standard Note 2024 and the time-extension notice point to the hosted copy; no DGMS copy found. |

## Done recently (not live until `main` moves)

- Labour Code texts cleaned of Gazette page headers, margin citations and stray headings (`tools/clean_code_text.py`); 480 marginal headings restored (`tools/margin_headings.py`).
- Mines Act 1952 → OSH&WC Code 2020 concordance published, every pair checked by hand (`CHECKED` in `tools/build_concordance.py`); 23 missing Mines Act section headings filled.

## Where things are

- Corpus pipeline and tools: `content/REGULATIONS-UPDATE.md`
- Monitoring (build, uptime, analytics, Search Console): `README.md`
- Secrets and where they are set: `SECRETS.md`

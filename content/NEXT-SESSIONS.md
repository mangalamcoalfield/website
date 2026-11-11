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
| Colliery Control draft (G.S.R. 865(E)) | cloud, 13 Nov | Comment window closes 12 Nov: mark it closed and awaiting final notification in `src/data/draft-watch.json`. |
| MMDR hosted PDF + live SQL | desktop, after owner OK | Replace `regs/mmdr-act-1957.pdf` on docs.mangalamcoal.com with IBM's compilation (as amended up to 20 Nov 2025; URL in the seed row's `source_url`), then run `supabase/regulations_nov2026_library.sql` (MMDR, MCDR 2017, MCR 2016 rows). |
| 2025–26 instruments not in the library | desktop | From egazette.gov.in / peso.gov.in (their TLS fails from cloud): MMDR Amendment Act 2026 (Act 20 of 2026); Jan Vishwas (Amendment of Provisions) Act 2026 (MMDR parts); Mines and Minerals Adjudication of Penalties Rules 2026 (G.S.R. 682(E), 30 Jul 2026); Explosives Rules amendments G.S.R. 284(E) (24 Apr 2025) and 154(E) (2 Mar 2026); verify Explosives (Second Amendment) Rules 2026, G.S.R. 887(E), ~14 Oct 2026. Text with `tools/rebuild_from_pdf.py`. |
| Four dead source links | desktop | `cmr-2017-02-sep` (unpublished), the CBT-2020 notification, Standard Note 2024 and the time-extension notice: look for DGMS copies (DGMS resets connections from cloud). |
| 32 poor-scan circulars | — | Mostly equipment-approval lists; Tesseract re-OCR (Nov 2026) gains little. Kept labelled and out of search. |
| Hindi summaries | owner / reviewer | 15 CMR 2017 regulations in `src/data/hindi-summaries.json`, labelled unchecked. A person who reads both languages should check each and set `checked` to the date. Extend once the pilot is reviewed. |
| DGMS check | desktop | Last checked 4 Nov 2026 (`dgms_checked` in `src/data/desk-checks.json`). Re-run `tools/discover_dgms.mjs` monthly. |
| Draft-Watch review | desktop | Re-check every item against its source; update `reviewed` in `src/data/draft-watch.json`. |
| Orphaned résumé | owner | One résumé file with no application (uploaded 5 Sep 2026) reaches the 90-day limit on 4 Dec 2026. Decide: contact the person, or remove `ORPHAN_DRY_RUN` so the daily job deletes it. |
| FTP credential in git history | owner decision | Commit 32f0744 (public). Rewriting history or changing the password is the owner's call; neither is to be done without asking. |

## Done recently

- 11 Nov (on `main-l3efey`, not live until `main` moves): MMDR Act 1957 principal text (IBM, to 20 Nov 2025, 64 sections); MCDR 2017 (to 31 Jan 2026) and MCR 2016 (to 30 Mar 2026) rebuilt with `tools/rebuild_from_pdf.py`; CMR 1957 regulation 36 restored (printed as a second "35." in our copy; DGMS cites it as 36); headings for 110 untitled provisions; tighter "likely now in" suggestions; Hindi summaries pilot (`/hi/regulations/saransh`).
- Cloud network: the "mangalam-website" environment also allows indiacode.nic.in, mines.gov.in, ibm.gov.in, cea.nic.in, labour.gov.in. egazette.gov.in, peso.gov.in and coal.gov.in fail TLS (weak CA key) and dgms.gov.in resets connections from cloud: those stay with the desktop.

- Labour Code texts cleaned of Gazette page headers, margin citations (including 15 stuck to line ends) and stray headings (`tools/clean_code_text.py`); 480 marginal headings restored (`tools/margin_headings.py`).
- Mines Act 1952 → OSH&WC Code 2020 concordance published, every pair checked by hand (`CHECKED` in `tools/build_concordance.py`); 23 missing Mines Act section headings filled.

- Hindi texts of the Mines Act, 1952 and OSH&WC Code, 2020 (machine-read, OCR), linked to the English texts. The Code's Hindi headings were recovered from its margin notes by OCR (`tools/hindi_margin_headings.py`, 143 of 143, checked against the English headings); the Mines Act's Hindi headings were cut at their "--".
- Light theme: sun/moon button beside the language button, remembered per browser; heroes and 3D sections stay dark (`.theme-dark`). New colours go in `src/styles/magic.css` for both themes.
- Git history: the owner decided (5 Nov) not to rewrite it for the e-mail addresses in old commits.
- Draft-Watch re-checked 4 Nov 2026 (NCWA-XII source fixed; G.S.R. 640(E) confirmed); BME exam notice of 8 Oct 2026 added to the seed.

## Where things are

- Corpus pipeline and tools: `content/REGULATIONS-UPDATE.md`
- Monitoring (build, uptime, analytics, Search Console): `README.md`
- Secrets and where they are set: `SECRETS.md`

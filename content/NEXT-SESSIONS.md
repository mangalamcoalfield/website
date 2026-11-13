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
| MMDR Act text: fold in the 2026 changes | anyone | The library text is IBM's to 20 Nov 2025. When IBM issues a compilation that includes the Jan Vishwas changes (ss. 21, 25A–25D, in force 1 Aug 2026) and the MMDR Amendment Act 2026 (s. 9D, in force 22 Aug 2026), rebuild with `tools/rebuild_from_pdf.py` and update the row's `status_note`. |
| 32 poor-scan circulars | — | Mostly equipment-approval lists; Tesseract re-OCR (Nov 2026) gained a few points on 6 tried, none reaching 0.7. Kept labelled and out of search; only better source copies would help. |
| Hindi summaries | owner / reviewer | 15 CMR 2017 regulations in `src/data/hindi-summaries.json`, labelled unchecked. A person who reads both languages should check each and set `checked` to the date. Extend once the pilot is reviewed. |
| DGMS check | desktop | Last checked 14 Nov 2026 (and 12 Nov): nothing new, 0 errors, 25 deliberate skips (33 before; the exam-notice listing now shows fewer old notices). Re-run `tools/discover_dgms.mjs` monthly. |
| Draft-Watch review | desktop | Reviewed 13 Nov 2026 (Colliery Control draft G.S.R. 865(E): comments closed 12 Nov, final rules not notified; e-Gazette searched by ministry). coal.gov.in doesn't answer from the desktop, but the same "What's New" listing loads at **coal.nic.in/whats-new**: nothing final on MPG-2026 and nothing on JBCCI-XII through 10 Nov; DGMS's gazette page still has only the draft OSH&WC (Coal Mines) Regulations. Re-check every item against its source; update `reviewed` in `src/data/draft-watch.json`. |
| Orphaned résumé | owner | One résumé file with no application (uploaded 5 Sep 2026) reaches the 90-day limit on 4 Dec 2026. Decide: contact the person, or remove `ORPHAN_DRY_RUN` so the daily job deletes it. |
| FTP credential in git history | owner decision (optional) | The file was `.hostinger.env.txt`, committed in 57663ea / 5de920b (4 Jul 2026) and removed in c15268b; 32f0744 holds no credential. The password was changed in August, so the copy in history no longer works (checked 12 Nov against the current one, without logging in). Only rewriting history remains, and it's the owner's call. |

## Done recently

- 12 Nov (desktop, live): six instruments added to the library, with hosted PDFs, full text and the live rows: MMDR Amendment Act 2026 (Act 20; s. 9D on State levies), Jan Vishwas Act 2026 (its MMDR and Coal Bearing Areas Act parts: pages 27 and 40–42), Mines and Minerals Adjudication of Penalties Rules 2026 (G.S.R. 682(E)), and the Explosives Rules amendments G.S.R. 284(E) of 2025, 154(E) and 887(E) of 2026 (887(E) verified final, 14 Oct 2026). Full texts were appended to the corpora by script rather than a full rebuild, so the earlier hand fixes stayed. The MMDR/MCDR/MCR hosted PDFs and `regulations_nov2026_library.sql` went live the same day.
- 12 Nov: the four dead source links (`cmr-2017-02-sep`, CBT-2020 notification, Standard Note 2024, time-extension notice) have no copy on DGMS's current listings or in the Internet Archive. They stay in `content/dead-source-links-2026-11.json`, so their pages point to our hosted copy.
- 12 Nov: Pit-head Bath Rules, 1959: no better copy exists. Our hosted file is byte-for-byte DGMS's own (`CoaPitHeadnew_22042026.pdf`, listed on its Gazette Notifications page), so the Lovely Prakashan reprint is what DGMS itself publishes. DGMS has no other file under the usual names, and the rules were superseded on 8 May 2026 anyway. Nothing to re-host.
- 12 Nov: `tools/upload_regs.mjs` crash fixed. Corpus `pdf` values that are full URLs were being sent as remote file names (550, then the connection reset); it now skips them, and connecting retries.

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

# Regulations Catalogue — Quality Curation Report

_Curation pass over `src/data/regulations-full-seed.json` (452 documents). Titles, summaries and keep/hide decisions were rebuilt from the source metadata in `Mining Regulation/INDEX.md`, `MANIFEST.csv`, and the extracted PDF text sidecars (`sources/**/_extracted/<name>.txt`)._

## Counts

| Metric | Count |
|---|---:|
| **Total documents** | 452 |
| **Kept (published = true)** | 272 |
| **Hidden (published = false)** | 180 |
| **Featured (cornerstone instruments)** | 19 |

Every entry now carries a clean, human, specific `title`, a real one-sentence `summary` (no templated "— a document under the … framework" filler on any kept entry), and a new boolean `featured` field. Array order and all other fields (slug, category, doc_number, authority, issued_date, status, status_note, source_url, source_filename, relevance, sort_order) were preserved.

## Hidden — breakdown by reason (180)

| Reason | Count |
|---|---:|
| Exam candidate / call / result / certificate-grant lists | 100 |
| Exam schedule / admin notices | 22 |
| Application forms / proformas / formats | 18 |
| Workshop / seminar / award / event notices | 10 |
| Rejection lists | 8 |
| Other administrative noise | 8 |
| Certificate upload / verification / issued lists | 5 |
| Fee-payment notices | 3 |
| Unidentifiable content | 2 |
| Annual returns | 1 |
| Address / contact notices | 1 |
| Authorisation letters | 1 |
| Duplicate / mislabelled scans | 1 |
| **Total hidden** | **180** |

Notable judgement calls:
- Several files whose **filenames** looked like base regulations (`CMR2017.pdf`, `MMR_1961.pdf`, `cmrmmr.pdf`) turned out, on reading their extracted text, to be **candidate certificate-grant lists** — these were hidden, and the genuine regulation texts (e.g. `CoalMinesRegulation2017.pdf` = CMR 2017 G.S.R. 1449(E); `Metalliferous_Mines_Regulation,_1961.pdf` = MMR 1961 G.S.R. 337) were kept and featured instead.
- **Fatal-accident Safety Alerts** and **DGMS Standard Notes / Statistics of Mines** volumes were kept as substantive safety material.
- **DGMS equipment-approval circulars** (e.g. "NNN of YYYY Coal", Electrical Approval circulars) were kept as substantive type-approval references.
- "NOTIFICATION FOR … EXAMINATION" items were split by content: statutory **exam bye-laws / competency rules** under CMR/MMR were kept; mere exam-sitting / schedule / venue announcements were hidden.

## Featured cornerstone instruments (19)

1. Coal Mines Regulations, 2017 (G.S.R. 1449(E)) — the base CMR 2017
2. Coal Mines Regulations, 2017 — Consolidated Amendments (2018–2024)
3. Draft OSH&WC (Coal Mines) Regulations, 2026
4. The Mines Act, 1952
5. The Mines Rules, 1955
6. The Mines Rescue Rules, 1985
7. The Mines Vocational Training Rules, 1966
8. The Metalliferous Mines Regulations, 1961 (G.S.R. 337)
9. Mines and Minerals (Development and Regulation) Act, 1957
10. The Code on Wages, 2019
11. The Industrial Relations Code, 2020
12. The Occupational Safety, Health and Working Conditions Code, 2020
13. The Code on Social Security, 2020
14. Environmental Impact Assessment (EIA) Notification, 2006
15. Van (Sanrakshan Evam Samvardhan) Rules, 2023
16. DGMS (Tech)(S&T) Circular 02 of 2025 — Minimum air quantity at Continuous Miner and Longwall panels
17. DGMS (Tech) Circular 01 of 2025 — Quality and Condition of Explosive Materials
18. DGMS (Tech) Circular 05 of 2025 — Underground Coal and Metalliferous Mines Safety
19. DGMS (Tech) Circular 06 of 2025 — Prevention of Fall of Person from Height or into Depth

## Example before → after fixes (15)

Each block shows the original junk title, the cleaned title (with kept/hidden status), and the new summary.

**1. `CoalMinesRegulation2017` → Coal Mines Regulations, 2017 (G.S.R. 1449(E))** — _[KEPT]_
The full Coal Mines Regulations, 2017 made under section 57 of the Mines Act, 1952, superseding the 1957 regulations and governing safety in every coal mine.

**2. `CMR (COAL)` → Coal Mines Regulations (CMR)** — _[KEPT]_
Text of the Coal Mines Regulations governing safety and operations in coal mines under the Mines Act 1952.

**3. `DGMS (Tech)(S&T) Circular 02 of 2025 — Ventilation (CMR Reg. 153)` → DGMS (Tech)(S&T) Circular 02 of 2025 — Minimum air quantity at Continuous Miner and Longwall panels** — _[KEPT]_
DGMS circular dated 17 April 2025 issuing guidelines on the minimum air quantity required at Continuous Miner and Longwall mass-production panels, interpreting Regulation 153 of CMR 2017.

**4. `Safety Alert` → Safety Alert: Fatal Accident during Safety Relief Valve Testing at Oil Mine (July 2021)** — _[KEPT]_
Reports a fatal accident at Oil India Limited's Tengakhat OCS where a safety relief valve failed during testing and dislodged the test bench, with preventive recommendations.

**5. `Coal 2015` → Statistics of Mines in India — Volume I (Coal), 2015** — _[KEPT]_
DGMS statistical publication compiling employment, output and safety statistics for coal mines under the Mines Act 1952, based on annual returns.

**6. `DGMS Tech 2/2022 - Rajmahal Court of Inquiry recommendations (procedure template only)` → DGMS (Tech) Circular 02 of 2022 — Recommendations of the Rajmahal Court of Inquiry** — _[KEPT]_
Conveys the recommendations of the Court of Inquiry into the 2016 Rajmahal opencast dump-failure that buried 23 workers, covering project-report approval, land acquisition and segregation of planning/execution authorities.

**7. `DGMS Tech 02/2020 - Systematic slope monitoring guidelines` → DGMS (Tech) Circular 02 of 2020 — Guidelines for systematic monitoring of opencast slopes** — _[KEPT]_
Issued under Regulation 106(2) of CMR 2017, standardises protocols for systematic slope-stability monitoring in opencast coal and metalliferous mines to enable timely withdrawal ahead of a slope failure.

**8. `DGMS Tech 01/2019 - Technical circular 01 of 2019` → DGMS (Tech) Circular 01 of 2019 — Safe conduct of operations in workover oil/gas mines** — _[KEPT]_
After a fatal fire from a mobile-phone ignition of a hydrocarbon-gas cloud, directs oil/gas mines to provide separator vessels and flare stacks and keep workover operations under statutory supervision.

**9. `cir_26_30062026` (summary was templated filler) → DGMS (Tech) Circular 26 of 2026 (30.06.2026)** — _[KEPT]_
Revises the DGMS-approved list of laboratories permitted to test the standard properties of chemical additives used for dust suppression in coal mines, broadening it beyond the four originally named institutions.

**10. `cmr2017 28112023` → List of candidates granted First Class Manager's Certificate (Unrestricted) under CMR 2017 (28-11-2023)** — _[HIDDEN]_
List of candidates granted First Class Manager's Certificate of Competency (Unrestricted) on examination basis under CMR 2017.

**11. `FINAL CALL LIST OF BLASTER (UN-RESTRICTED) EXAM SCHEDULED ON 22-07-2019 AT DHANBAD CENTRE` → Final call list — Blaster (Unrestricted) competency exam, Dhanbad (22 Jul 2019)** — _[HIDDEN]_
Final call list of candidates summoned for the Blaster (Unrestricted) certificate of competency examination at DGMS Dhanbad.

**12. `Organization of National Safety Awards at Vigyan Bhawan on 20-03` → National Safety Awards (Mines) function 2011 & 2012 at Vigyan Bhawan** — _[HIDDEN]_
Account of the National Safety Awards (Mines) presentation function for contest years 2011 and 2012, held at Vigyan Bhawan, New Delhi on 20 March 2015.

**13. `One day technical workshop on Latest trends in Strata Control in Longwall Mining …` → One-day technical workshop on strata control in longwall mining (DGMS, 20 Jan 2017)** — _[HIDDEN]_
Report of a one-day DGMS technical workshop on latest trends in strata control and strata-monitoring techniques for longwall mining, held at Dhanbad.

**14. `OVERMAN (UNRESTRICTED) ORAL AUTHORISATION LETTER CMR 2017` → Overman (Unrestricted) Oral Examination Authorisation Letters under CMR 2017** — _[HIDDEN]_
System-generated authorisation letters admitting named candidates to the 2018 Overman oral examination at DGMS Dhanbad.

**15. `DGMS Tech 11/2020 - Online annual return submission via DGMS website` → DGMS (Tech) Circular 11 of 2020 — Online submission of annual returns** — _[HIDDEN]_
Administrative circular notifying mines that annual returns can now be filed online through the DGMS website software module.

## Deliverables

- `src/data/regulations-full-seed.json` — 452 entries with cleaned `title` + `summary`, keep/hide `published`, and the new `featured` field. Valid JSON, original order preserved.
- `supabase/regulations_full_seed.sql` — regenerated upsert; `featured` added to the column list, VALUES rows, and the `on conflict … do update set` clause. (The `featured` DB column is to be added separately.)
- `content/CURATION-REPORT.md` — this report.

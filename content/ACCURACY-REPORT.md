# Legal-Status Accuracy Report — Regulations Catalogue

**Pass date:** 2026-07-04
**Authority:** `Mining Regulation/INDEX.md` → "⭐ Supersessions & Draft-watch" table (as at 2026-06-23), plus `RETRIEVAL_GUIDE.md`.
**Files corrected:**
- `src/data/regulations-seed.json` (47 core entries — live site)
- `src/data/regulations-full-seed.json` (452 comprehensive entries)
- SQL regenerated: `supabase/regulations_seed.sql`, `supabase/regulations_full_seed.sql` (new `status_note` column added to insert list + DO UPDATE set)

Every entry now carries a `status_note` field (short nuance string, or `null` where the plain status is self-explanatory — e.g. DGMS exam/call/rejection lists, forms, safety alerts, ordinary technical circulars).

## Headline counts

| File | Entries | Status changed | status_note added (non-null) |
|---|---|---|---|
| regulations-seed.json (core) | 47 | 1 | 24 |
| regulations-full-seed.json (full) | 452 | 7 | 32 |

---

## 1. Status changes (old → new)

| Title | slug | Change | status_note | Reason / authority |
|---|---|---|---|---|
| Mines Act, 1952 | `mines-act-1952` | in_force → **superseded** | Subsumed by the OSH&WC Code, 2020 (in force 21 Nov 2025); subordinate rules continue under savings. | Supersessions table: OSH&WC Code 2020 subsumes/repeals the Mines Act; Code in force 21.11.2025. *(both files)* |
| Coal Mines Regulation, 1957 | `coal-mines-regulation-1957` | in_force → **superseded** | Superseded by the Coal Mines Regulations, 2017. Retained for reference. | Old 1957 coal-mines code (standalone doc, mis-categorised as a circular); replaced by CMR 2017. *(full only)* |
| DGMS 01/2021 — Bye-Laws for Grant of Competency Certificates under CMR 2017 and MMR 1961 (WITHDRAWN 23.03.2026) | `dgms-01-2021-bye-laws-for-grant-of-competency-certificates-under-cmr-2017-and-mmr-1961-wit` | in_force → **superseded** | Withdrawn by DGMS gazette notification dated 23 Mar 2026. | INDEX.md CMR-2017 section lists "Withdrawal of CMR 2017 competency Bye-laws 23.03.2026"; title itself flags WITHDRAWN. *(full only)* |
| Draft Code on Wages (Central) Rules, 2025 | `draft-code-on-wages-central-rules-2025` | draft → **superseded** | Draft superseded by the final Code on Wages (Central) Rules, 2026 (published 8 May 2026). | Supersessions table: four (Central) Rules, 2026 final published 08.05.2026; the 2025 drafts are the superseded precursors. *(full only)* |
| Draft Industrial Relations Code (Central) Rules, 2025 | `draft-industrial-relations-code-central-rules-2025` | draft → **superseded** | Draft superseded by the final IR Code (Central) Rules, 2026 (published 8 May 2026). | Same as above. *(full only)* |
| Draft OSH&WC Code (Central) Rules, 2025 | `draft-occupational-safety-health-and-working-conditions-code-central-rules-2025` | draft → **superseded** | Draft superseded by the final OSH&WC Code (Central) Rules, 2026 (published 8 May 2026). | Same as above. *(full only)* |
| Draft Social Security Code (Central) Rules, 2025 | `draft-social-security-code-central-rules-2025` | draft → **superseded** | Draft superseded by the final Social Security Code (Central) Rules, 2026 (published 8 May 2026). | Same as above. *(full only)* |

**Total distinct status changes:** 1 in core seed; 7 in full seed (core's single change is `mines-act-1952`, which is also one of the 7 in the full seed).

Resulting status distributions:
- Core: in_force 41, superseded 5, draft 1
- Full: in_force 437, superseded 11, draft 4

---

## 2. status_note added WITHOUT a status change (nuance annotations)

These entries keep their existing status; a note was added to clarify supersession/savings/draft context on the badge.

| Title | slug | Status (unchanged) | status_note |
|---|---|---|---|
| Coal Mines Regulations, 2017 | `coal-mines-regulations-2017` | in_force | Operative coal-mine safety code; new Draft OSH&WC (Coal Mines) Regs 2026 not yet in force. *(core only — full seed has no principal CMR 2017 row)* |
| CMR 2017 — Consolidated Amendments (2018–2024) | `cmr-2017-amendments-consolidated-2024` | in_force | Amends CMR 2017; CMR 2017 remains operative. |
| CMR 2017 Amendment — Assistant Manager (Reg. 30) | `cmr-2017-amendment-assistant-manager-2025` | in_force | Amends CMR 2017 (Reg. 30); CMR 2017 remains operative. |
| CMR 2017 Amendment — Gas Testing Certificate (2025) | `cmr-2017-amendment-gas-testing-certificate-2025` | in_force | Amends CMR 2017; CMR 2017 remains operative. (Related 2021 competency bye-laws withdrawn 23 Mar 2026.) |
| Coal Mines Regulations, 2017 (copy) | `coal-mines-regulations-2017-copy-3` | in_force | Reference copy of CMR 2017 (operative). *(full only)* |
| Coal & Metalliferous Mines Regulations (combined copy) | `coal-metalliferous-mines-regulations-combined-copy` | in_force | Reference copy of CMR 2017 / MMR 1961 (both operative). *(full only)* |
| Draft OSH&WC (Coal Mines) Regulations, 2026 | `draft-oshwc-coal-mines-regulations-2026` | draft | Draft — 45-day public consultation; NOT in force. CMR 2017 remains operative. |
| Mines Rules, 1955 | `mines-rules-1955` | in_force | Continues in force under the OSH&WC Code transition (savings), pending replacement. |
| Mines Rescue Rules, 1985 | `mines-rescue-rules-1985` | in_force | Continues in force under the OSH&WC Code transition (savings), pending replacement. |
| Mines Vocational Training Rules, 1966 | `mines-vocational-training-rules-1966` | in_force | Continues in force under the OSH&WC Code transition (savings), pending replacement. |
| Metalliferous Mines Regulations, 1961 | `metalliferous-mines-regulations-1961` | in_force | Current safety code for metalliferous (non-coal) mines; analogue reference for coal. |
| The Code on Wages, 2019 | `code-on-wages-2019` | in_force | In force from 21 Nov 2025. |
| The Industrial Relations Code, 2020 | `industrial-relations-code-2020` | in_force | In force from 21 Nov 2025. |
| The OSH&WC Code, 2020 | `oshwc-code-2020` | in_force | In force from 21 Nov 2025; subsumes the Mines Act, 1952 (subordinate rules continue under savings). |
| The Code on Social Security, 2020 | `code-on-social-security-2020` | in_force | In force from 21 Nov 2025. |
| Code on Wages (Central) Rules, 2026 | `code-on-wages-central-rules-2026` | in_force | Final central rules published 8 May 2026. |
| Industrial Relations Code (Central) Rules, 2026 | `industrial-relations-code-central-rules-2026` | in_force | Final central rules published 8 May 2026. |
| OSH&WC Code (Central) Rules, 2026 | `oshwc-code-central-rules-2026` | in_force | Final central rules published 8 May 2026. |
| Social Security Code (Central) Rules, 2026 | `social-security-code-central-rules-2026` | in_force | Final central rules published 8 May 2026. |
| OSH&WC (Central) Rules 2026 (DGMS copy) | `osh-wc-central-rules-2026-dgms-copy-12-05-2026` | in_force | Final central rules published 8 May 2026 (DGMS copy). *(full only)* |
| Van (Sanrakshan Evam Samvardhan) Rules, 2023 | `van-sanrakshan-evam-samvardhan-rules-2023` | in_force | In force from 1 Dec 2023. |
| Explosives Rules, 2008 | `explosives-rules-2008` | in_force | Current explosives rules under the Explosives Act, 1884 (PESO). |

Existing `superseded` entries also received naming notes: Coal Mines Regulations 1957 (`coal-mines-regulations-1957`), Forest (Conservation) Rules 2022 (`forest-conservation-rules-2022`), Mining Plan Guidelines 2019 (`moc-mining-plan-guidelines-2019`), CEA 2010 Regulations (`cea-measures-relating-to-safety-regulations-2010`) — each note names the successor instrument.

---

## 3. Flagged for human review

None of the below were changed; existing values were kept (conservative default). Verify before quoting.

1. **Jharkhand state rules under the Labour Codes** — entries `code-on-wages-jharkhand-rules-2021-state-rule-under-the-codes`, `occupational-safety-health-wc-jharkhand-rules-2021-state-rule-mine-relevant`, `industrial-relations-code-jharkhand-notification`. Left `in_force`. The Supersessions table explicitly says "Jharkhand state rules under the Codes: NOT located — verify state effective dates before quoting." No status asserted; no state dates added.
2. **CMR 2017 Amendment — Gas Testing Certificate (2025)** (`cmr-2017-amendment-gas-testing-certificate-2025`) — kept `in_force`. The related **DGMS 01/2021 competency bye-laws were withdrawn 23.03.2026**, but the gas-testing *certificate amendment to CMR 2017* is a distinct instrument and appears still operative. Note flags the withdrawal for context. Confirm the amendment itself was not also withdrawn.
3. **`draft-mmr-2018` (Draft MMR 2018)** — kept `draft`. This is a historical draft of the Metalliferous Mines Regulations that was never finalised (MMR 1961 remains operative). Not marked superseded because no successor MMR was ever notified; "draft" (never-in-force) is the accurate badge. Confirm it should remain listed at all.
4. **`draft-standards-diesel-equipment` / `feedback-draft-standards-diesel-equipment`** — kept `draft`. Draft technical standards + feedback document; never a notified instrument. Left as draft (not in force). Low relevance.
5. **`centralelectricityauthorityregulation`** (`mines_act` category, terse OCR title) — kept `in_force`. Ambiguous which CEA regulation year this file is (2010 superseded vs 2023 current). Could not determine version from the entry; kept as-is. Verify whether it is the 2010 (superseded) copy.
6. **`mineregulations1961-13092023` / `metalliferous-mines-regulation-1961`** (`dgms_circular` category) — kept `in_force`. These are copies/notices of MMR 1961, which is current for non-coal mines; left in_force with no note (self-explanatory). Category mis-tag noted but not changed (out of scope).
7. **DGMS Legis 2017 — Mines Rules 1955 amendment for registers** (`dgms-legis-2017-mines-rules-1955-amendment-ease-of-compliance-for-registers`) — kept `in_force`. An amendment circular; Mines Rules 1955 remain operative under savings. No supersession asserted.

### Deliberately left unchanged (correctly `in_force`, note = null)
The large body of DGMS exam call/rejection/authorisation lists, application forms, safety alerts, medical/gas-testing notices, and ordinary technical circulars (~400 entries in the full seed) were left `in_force` with `status_note = null`, per the judgement rules — these are "current as issued," not laws with a supersession status. No fabricated supersessions were introduced.

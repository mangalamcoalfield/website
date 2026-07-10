# Amlabad Colliery / Mangalam Coalfield — Press Coverage Research

Research date: 2026-07-10. Purpose: source an accurate "In the news" page for mangalamcoal.com.
Principle applied: **accuracy over quantity** — every item below was opened and its headline/date read directly. Nothing was invented. Where the WebFetch tool was blocked by a host, the page was opened in a real browser (Playwright) and the headline, published-time meta tag, and body text were read there.

Total verified, directly-relevant items: **11** (written to `src/data/news.json`, newest first).
Sensitive-flagged: **2**.

---

## The verified storyline (safe to paraphrase on the site)

- **Amlabad (also spelled Amalabad) colliery** is a historic BCCL (Bharat Coking Coal Ltd, a Coal India subsidiary) **underground coking-coal mine** on the Dhanbad–Bokaro border, in the **Eastern Jharia (EJ/IJE) Area**, Chandankiyari, Bokaro district, Jharkhand. Press describes it as ~**106 years old**.
- It **closed on 29 February 2008** after the **guide rope of its No. 2 chute (chanak) broke** (a safety failure) — so it has been shut for roughly **14–16 years** depending on the article's date. Workforce fell from ~2,400–3,000 in its prime to a few dozen maintenance staff; the local economy declined.
- Reserves are reported by different outlets as ~**40–50+ million tonnes** of **prime coking coal**; the 2026 project figure most cited is **~6.2 million tonnes (62 lakh tonnes)** of quoted/prime coking coal, washery grade-1 and grade-2.
- **Revival route:** BCCL is reopening it under the **MDO (Mine Developer & Operator) model on a revenue-sharing basis**. The **BCCL board approved awarding Amlabad to Mangalam (Mangalam Coalfield / "Mangalam Consortium") in late October 2023**, at **4.1% per-tonne revenue share to BCCL for a 25-year term** (project ~Rs 250 crore). LOI/LOA and formalities were reported complete by **January 2024**.
- **Significance:** coking coal is essential for **steel-making**; the Jharia coalfield is India's main prime-coking-coal repository, and BCCL supplies a large share of the steel sector's coking coal. Outlets frame Amlabad's revival as boosting **domestic coking-coal availability, cutting import dependence, and adding energy security for ~2 decades** — plus **local employment**.
- **June 2026:** BCCL CMD **Manoj Kumar Agarwal** reviewed the project in Eastern Jharia and **directed it be made operational within ~3 months**, fast-tracking statutory/environmental clearances. This triggered a fresh wave of coverage (Jagran, Navbharat Times, Live Hindustan, Indian PSU).

### Caution / disambiguation (things NOT to conflate)
- The **March 2023 PIB / Ministry of Coal press release** "BCCL Awards Work on Revenue Sharing basis in MDO Model" is about **Katras (R K Transport, 9%), PB Area (Eagle Infra, 6%), and Sijua (Vensar, 7.29%)** — **NOT Amlabad/Mangalam.** Do not cite it for Amlabad. (Verified: it does not contain the words Amlabad/Amalabad/Mangalam.)
- Several English trade stories about BCCL "restarting a long-shut coking-coal mine under MDO" (Business Standard, SteelOrbis, ConstructionWorld, Jul 2025) refer to the **PB project / Eagle Infra (52 MT)** — a **different mine**, not Amlabad. Excluded.
- The initial Amlabad tender was reported cancelled for want of bids and **re-tendered** before the award to Mangalam.

---

## Step 1 — the 8 owner-supplied URLs (all verified as loading)

| # | Publication | Loaded? | How | Date | Headline (Hindi) |
|---|---|---|---|---|---|
| 1 | Dainik Jagran | YES | WebFetch blocked → **browser** | 2026-06-11 | BCCL Amlabad Mine: स्टील इंडस्ट्री के लिए गेमचेंजर बनेगी धनबाद की यह खदान, 25 साल तक उगलेगी 'काला सोना' |
| 2 | Navbharat Times | YES | WebFetch blocked → **browser** | 2026-06-13 | BCCL का मास्टरस्ट्रोकः स्टील सेक्टर के लिए संजीवनी बनेगी अमलाबाद खदान, अगले 2 दशकों तक देश को मिलेगी ऊर्जा सुरक्षा |
| 3 | Prabhat Khabar | YES | WebFetch | 2024-05-09 | 16 वर्ष बाद खुलेगी अमलाबाद कोलियरी, एक वर्ष के भीतर शुरू होगा उत्पादन |
| 4 | Prabhat Khabar | YES | WebFetch | 2023-10-30 | बंद अमलाबाद कोलियरी से जल्द शुरू होगा उत्पादन, आउटसोर्सिंग कंपनी मंगलम को रेवेन्यू शेयरिंग पर मिला खनन का ठेका |
| 5 | Live Hindustan | YES | WebFetch blocked → **browser** | 2024-01-03 | आमलाबाद कोलियरी को एमडीओ मोड में चालू करने की सारी प्रकिया पूरी |
| 6 | Live Hindustan | YES | WebFetch blocked → **browser** | 2026-06-11 | अमलाबाद कोलियरी तीन माह में होगी चालू: सीएमडी  **(SENSITIVE)** |
| 7 | Dainik Bhaskar | YES | WebFetch blocked → **browser** | 2014-03-31 | 2008 से बंद पड़ी है बीसीसीएल की अमलाबाद कोलियरी |
| 8 | Live Hindustan | YES | WebFetch blocked → **browser** | 2022-08-24 | 14 साल बाद चालू होगी 106 साल पुरानी आमलाबाद कोलियरी |

**Fetch-tool note:** `www.jagran.com`, `navbharattimes.indiatimes.com`, `www.livehindustan.com`, `www.bhaskar.com`, and `pib.gov.in` all **blocked the WebFetch tool (403 / "unable to fetch")**. Each was successfully opened in a real browser instead, and headline + `article:published_time` meta + body were read there. `www.prabhatkhabar.com` works fine with WebFetch. **0 of 8 owner URLs failed** — all are live with matching headlines.

Per-URL verified facts:
1. **Jagran (11 Jun 2026):** CMD Manoj Kumar Agarwal reviewed the project; ~62 lakh tonnes prime coking coal; washery grade-1 & grade-2; 25-year production horizon for the steel industry; push to complete approvals fast.
2. **Navbharat Times (13 Jun 2026):** Amlabad on Dhanbad-Bokaro border; ~62 lakh tonnes prime coking coal; production feasible 2–3 decades; developed under revenue-sharing model; called a "lifeline/sanjeevani" for heavy industry and energy security.
3. **Prabhat Khabar (9 May 2024):** Closed 16 years; MCPL + BCCL site inspection; 25-year MDO; production within a year; direct/indirect local jobs in Chandankiyari.
4. **Prabhat Khabar (30 Oct 2023):** BCCL board approved awarding Amlabad (IJE area) to Mangalam, 25-year MDO at 4.1% revenue share; board also approved closure of Kusunda and Loyabad mines.
5. **Live Hindustan (3 Jan 2024):** Shut ~15 years; mining by "Mangalam Consortium"; LOI issued; ~Rs 250 crore project; security deposit ~Rs 7.575 crore due by 8 Feb; 4.1% per-tonne revenue share; production expected Mar/Apr 2024; 25-year term; high-grade coal near the Damodar.
6. **Live Hindustan (11 Jun 2026):** CMD directed restart within 3 months; mine allotted to Mangalam Coalfield Pvt Ltd in 2024 under a 25-year contract; revenue-sharing MDO; fast-track environmental/statutory clearances. **CMD also spoke of ending coal smuggling** → flagged sensitive.
7. **Dainik Bhaskar (31 Mar 2014):** Historical/background; only BCCL colliery in Chandankiyari; closed since 29 Feb 2008; workforce fell ~2,400 → ~100; area's markets subdued; written around the 2014 Lok Sabha election.
8. **Live Hindustan (24 Aug 2022):** 106-year-old mine; closed since 29 Feb 2008 (No. 2 chute guide-rope failure); ~40 million tonnes prime coking coal; to run in MDO mode; contractors inspected the site (process begun May 2022, targeted completion Sept 2022).

## Step 2 — additional items found & verified (3 kept)

9. **Indian PSU (en, 10 Jun 2026)** — "BCCL CMD Reviews Production, Dispatch and Monsoon Preparedness in East Jharia Area." Verified via WebFetch. Names the **proposed Amalabad underground mine**, MDO/revenue-sharing route, directive to fast-track approvals incl. environmental clearance. (Good English-language source.)
10. **Prabhat Khabar (hi, 10 May 2024)** — "दो नंबर चानक का गाइड रस्सा टूटने पर बंद हो गयी थी अमलाबाद कोलियरी." Background on the 2008 guide-rope closure; >50 MT coking coal; workforce ~3,000 → few dozen.
11. **Prabhat Khabar (hi, 30 May 2025)** — "स्थानीय मजूदरों को काम पर रखें कंपनी, नहीं तो गेट करेंगे जाम : संयुक्त मोर्चा." **(SENSITIVE)** Local joint front threatens a gate blockade demanding local hiring, after a truck of iron was seized at the Mangalam-operated Amlabad colliery; demand for a police inquiry.

### Candidates checked and deliberately EXCLUDED (not Amlabad/Mangalam-specific, to avoid inaccuracy)
- PIB / Ministry of Coal (22 Mar 2023) MDO award release — Katras/PB/Sijua only; no Amlabad/Mangalam. (Verified.)
- Business Standard / SteelOrbis / ConstructionWorld (Jul 2025) "BCCL restarts long-shut coking-coal mine" — **PB project / Eagle Infra**, different mine.
- Prabhat Khabar "बीसीसीएल कोकिंग कोल आपूर्ति की रीढ़ है : सीएमडी" (13 May 2025) and Bhojudih washery story (27 May 2026) — relevant to BCCL coking coal but do **not** mention Amlabad. Not used.
- Company's own LinkedIn post "Amlabad Colliery Revives After 16 Years" — first-party, not third-party press; excluded from a news page.

## Sensitive-flagged (kept in the file, `sensitive: true`)
- **Live Hindustan, 11 Jun 2026** (#6) — restart directive framed alongside a coal-smuggling crackdown.
- **Prabhat Khabar, 30 May 2025** (#11) — local protest / gate-blockade threat + seized-iron dispute at the Mangalam-run colliery.

Both are factual and on-topic; retained (flagged) rather than dropped, so the site owner can decide whether to display them.

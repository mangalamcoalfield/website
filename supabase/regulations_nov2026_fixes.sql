-- Regulation fixes, 4 Nov 2026. Run once; regulations_full_seed.sql carries the same values for fresh installs.
-- Run AFTER the hosted PDFs are in place (they are, checked by size and SHA-256) and BEFORE the site is rebuilt:
-- the library pages are built from this table. download_url and file_size_kb are not in the seed (the database is
-- the source of truth for them), so they are set here.
begin;

-- 1. Official source links: DGMS files whose real names have spaces, or that were renamed.
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/AMENDMENTS%20IN%20EARLIER%20BYE-LAWS%20NOTIFIED%20UNDER%20CMR,%202017.pdf' where slug = 'amendments-in-earlier-bye-laws-notified-under-cmr-2017';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/Content/DGMS_Approval_Policy-Second%20_Revision-2016.pdf' where slug = 'approval-policy-second-revision';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/BYE-LAWS%20NOTIFIED%20UNDER%20MMR,%201961.pdf' where slug = 'bye-laws-notified-under-mmr-1961';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/CentralElectricity2023.pdf' where slug = 'cea-safety-electric-supply-regulations-2023';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/DGMScircularsfrom20182024_06122024.pdf' where slug = 'dgms-circulars-2018-2024-06122024';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/CIRCULARSNew_19092025.pdf' where slug = 'dgms-circulars-uptojune2017-circularsnew-19092025';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/STANDARD%20OPERETAING%20PROCEDURE.pdf' where slug = 'dgms-sop-covid-19-cmr-mmr-examinations';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/DGMS%20Tech%20Circular%20(Electrical),%20(Approval)%20No-%2012.pdf' where slug = 'dgms-tech-circular-electrical-approval-no-12';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/cmr155501120.pdf' where slug = 'form-for-extraction-of-coal-by-a-system-other-than-the-board-and-pillar-system-under-cmr-1';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/Mines%20Rescue%20Rules,%201985.pdf' where slug = 'mines-rescue-rules-1985';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/MineVocational966.pdf' where slug = 'mines-vocational-training-rules-1966';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/MMR_Notification637186539489175908.pdf' where slug = 'mmr-notification';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/Notice%20regarding%20Senior%20and%20Junior%20Medical%20Examination%20under%20the%20Metalliferous%20Mines%20Regulation,%201961.pdf' where slug = 'notice-regarding-senior-and-junior-medical-examination-under-the-metalliferous-mines-regul';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/Oil%20Mines%20Regulation,%201984.pdf' where slug = 'oil-mines-regulation-1984';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/Safety%20Alert637635015675831251.pdf' where slug = 'safety-alert';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/Standard%20Operating%20Procedure%20for%20COVID-19637393903069005561.pdf' where slug = 'standard-operating-procedure-for-covid';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/VOLUME-I-(COAL)%202014636129985100886136.pdf' where slug = 'volume-i-coal';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/MineRegulations1961_13092023.pdf' where slug = 'metalliferous-mines-regulation-1961';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/MinesAct1952.pdf' where slug = 'mines-act-1952';
update public.regulations set source_url = 'https://www.dgms.gov.in/writereaddata/UploadFile/Central%20Electricity%20Authority%20Regulation,%202010.pdf' where slug = 'cea-measures-relating-to-safety-regulations-2010';

-- 2. CEA 2010: the complete 367-page PDF replaced one cut off at 1 MiB.
update public.regulations set source_filename = 'Central_Electricity_Authority_Regulation,_2010.pdf', file_size_kb = 13515 where slug = 'cea-measures-relating-to-safety-regulations-2010';

-- 3. Colliery Control PDFs now hosted.
update public.regulations set download_url = 'https://docs.mangalamcoal.com/regs/colliery-control-second-amendment-rules-2026.pdf', file_size_kb = 574 where slug = 'colliery-control-second-amendment-rules-2026';
update public.regulations set download_url = 'https://docs.mangalamcoal.com/regs/draft-colliery-control-amendment-rules-2026-gsr-865e.pdf', file_size_kb = 731 where slug = 'draft-colliery-control-amendment-rules-2026-gsr-865e';

-- 4. Duplicate with a broken PDF: coal-mines-regulations-2017 is the entry (vercel.json redirects the old address).
update public.regulations set published = false where slug = 'cmr-2017-02-sep';

-- 5. Titles and numbers as the PDFs print them. Slugs and circular ids are unchanged.
update public.regulations set title = 'DGMS (Legis) Circular No. 01 of 2019 — Equal Employment Opportunity for Women in Mines', doc_number = 'DGMS (Legis) Circular No. 01 of 2019' where slug = 'dgms-legis-2019-equal-employment-opportunity-for-women-in-mines';
update public.regulations set title = 'DGMS (Legis) Circular No. 02 of 2019 (Revised) — Equal Employment Opportunity for Women in Mines', doc_number = 'DGMS (Legis) Circular No. 02 of 2019 (Revised)' where slug = 'dgms-legis-circular-2019-women-employment';
update public.regulations set title = 'DGMS (Tech)(SOMA) Circular No. 03 of 2024 — Ensuring Safety in Opencast Coal Mines: Preventing Accidents Involving Wheeled Trackless Transportation Machinery', doc_number = 'DGMS (Tech)(SOMA) Circular No. 03 of 2024' where slug = 'dgmscircular3-27082024';
update public.regulations set title = 'DGMS Tech Circular (Electrical)(Approval) No. 12 — Cables Requiring DGMS Approval for Coal and Oil Mines', doc_number = 'DGMS Tech. Circular (Electrical), (Approval) No. 12' where slug = 'dgms-tech-circular-electrical-approval-no-12';

-- 6. New library entries, with their hosted PDFs.
insert into public.regulations (slug, title, category, summary, doc_number, authority, issued_date, status, status_note, source_url, source_filename, relevance, sort_order, published, featured, download_url, file_size_kb) values
  ('cea-safety-electric-supply-amendment-regulations-2026', 'Central Electricity Authority (Measures relating to Safety and Electric Supply) Amendment Regulations, 2026', 'cea', 'Amends the CEA Safety Regulations, 2023 by defining battery energy storage systems and adding Chapter XA (regulations 122(A) to 122(N)) of safety requirements for them, including two-fault tolerance and an independent third-party fire safety audit. It also adds regulation 137, under which the Authority will issue a list of relevant standards.', 'F. No. CEA-PS-16/1/2021-CEI Division', 'CEA', '2026-03-27', 'notified', 'Final text notified on 27 March 2026; comes into force on 1 April 2027.', 'https://egazette.gov.in/WriteReadData/2026/271455.pdf', 'CEA_Safety_Amendment_Regulations_2026_BESS_27032026.pdf', 2, 80, true, false, 'https://docs.mangalamcoal.com/regs/cea-safety-electric-supply-amendment-regulations-2026.pdf', 3030)
on conflict (slug) do update set title = excluded.title, category = excluded.category, summary = excluded.summary, doc_number = excluded.doc_number, authority = excluded.authority, issued_date = excluded.issued_date, status = excluded.status, status_note = excluded.status_note, source_url = excluded.source_url, source_filename = excluded.source_filename, relevance = excluded.relevance, sort_order = excluded.sort_order, published = excluded.published, featured = excluded.featured, download_url = excluded.download_url, file_size_kb = excluded.file_size_kb;
insert into public.regulations (slug, title, category, summary, doc_number, authority, issued_date, status, status_note, source_url, source_filename, relevance, sort_order, published, featured, download_url, file_size_kb) values
  ('moc-cmsp-section-24a-adjudication-authority-order-2026', 'Ministry of Coal Order No. 22/2/2014-ASO — Nominated Authority Appointed as Adjudication Authority under Section 24A, Coal Mines (Special Provisions) Act, 2015', 'moc', 'Appoints the Nominated Authority under section 6 of the Coal Mines (Special Provisions) Act, 2015 as the Adjudication Authority under section 24A, to hold inquiries and impose penalties in the form and manner to be prescribed. It does this in addition to its existing functions under that Act.', 'No. 22/2/2014-ASO', 'Ministry of Coal', '2026-09-09', 'in_force', null, 'https://coal.gov.in/sites/default/files/2026-09/15-09-2026a-wn.pdf', 'MoC_CMSP_s24A_AdjudicationAuthority_Order_09092026.pdf', 2, 76, true, false, 'https://docs.mangalamcoal.com/regs/moc-cmsp-section-24a-adjudication-authority-order-2026.pdf', 385)
on conflict (slug) do update set title = excluded.title, category = excluded.category, summary = excluded.summary, doc_number = excluded.doc_number, authority = excluded.authority, issued_date = excluded.issued_date, status = excluded.status, status_note = excluded.status_note, source_url = excluded.source_url, source_filename = excluded.source_filename, relevance = excluded.relevance, sort_order = excluded.sort_order, published = excluded.published, featured = excluded.featured, download_url = excluded.download_url, file_size_kb = excluded.file_size_kb;

commit;

-- Library corrections from the 4 Nov 2026 Draft-Watch re-check. Run once in the Supabase SQL editor
-- (or npx supabase db query --linked -f ...); regulations_full_seed.sql carries the same values.
--   colliery-control-second-amendment-rules-2026: drop an unsourced claim about the Jan Vishwas Act.
--   cmr-2017-amendment-assistant-manager-2025: a Reg. 30 notification of 16 Sep 2025, not an amendment of
--     CMR 2017 dated 9 Oct (that was DGMS's file name); replaces G.S.R. 427(E). Slug unchanged.
--   van-sanrakshan-evam-samvardhan-rules-2023: its G.S.R. number, and a note that it has been amended since.
begin;
update public.regulations set title = 'CMR 2017 — Scale of Appointment of Assistant Managers (Reg. 30 notification)', summary = 'Notification under regulation 30 of the Coal Mines Regulations, 2017, published in the Gazette on 16 September 2025, fixing the scale of appointment of Assistant Managers in coal mines. It replaces the earlier notification G.S.R. 427(E). It is a notification under CMR 2017, not an amendment of the Regulations.', issued_date = '2025-09-16', status_note = 'Made under Reg. 30 of CMR 2017; replaces G.S.R. 427(E).' where slug = 'cmr-2017-amendment-assistant-manager-2025';
update public.regulations set doc_number = 'G.S.R. 869(E)', status_note = 'In force from 1 Dec 2023; amended since (including G.S.R. 877(E), 29 Nov 2025, and G.S.R. 174(E), 11 Mar 2026). The text here is as notified in 2023.' where slug = 'van-sanrakshan-evam-samvardhan-rules-2023';
update public.regulations set summary = 'Notified as G.S.R. 797(E) on 9 September 2026 under section 18 of the MMDR Act 1957. It substitutes rule 13 (Penalty) of the Colliery Control Rules, 2004: whoever contravenes the rules is now liable to a penalty under sections 25A and 25B of the MMDR Act and the rules made under them, the Mines and Minerals Adjudication of Penalties Rules, 2026. It takes effect on publication in the Official Gazette.' where slug = 'colliery-control-second-amendment-rules-2026';
commit;

-- 11 Nov 2026 library update, part 1: the MMDR Act, 1957.
-- The library's MMDR Act row now describes the principal Act as amended up to
-- 20 Nov 2025 (IBM compilation, Jan 2026); its full text was rebuilt from that PDF.
-- Run after the IBM PDF has replaced regs/mmdr-act-1957.pdf on docs.mangalamcoal.com.
begin;
update public.regulations set
  summary = 'The MMDR Act, 1957 is the central law regulating mines and minerals other than petroleum and natural gas. It governs mineral concessions (prospecting licences, exploration licences, mining leases and composite licences, granted by auction), royalty and dead rent, the District Mineral Foundation and the National Mineral Exploration and Development Trust, and the rule-making powers for mineral conservation, development and the prevention of illegal mining. The text here is the Indian Bureau of Mines'' compilation of the Act as amended up to 20 November 2025 (issued January 2026).',
  status_note = 'Text as amended up to 20 Nov 2025 (IBM compilation, Jan 2026). Later changes, including the MMDR Amendment Act, 2026 and the Jan Vishwas amendments of 2026, are not yet in this text.',
  source_url = 'https://ibm.gov.in/writereaddata/files/177132272469943d64d720dMMDR_Act_1957_as_amended_upto_20.11.2025.pdf',
  source_filename = 'MMDR_Act_1957_as_amended_upto_20.11.2025.pdf'
where slug = 'mmdr-act-1957';

-- MCDR 2017 and MCR 2016: texts now from IBM's latest compilations.
update public.regulations set source_url = 'https://ibm.gov.in/writereaddata/files/1770927972698e376449ea2MCDR_2017_updated_up_to_31January2026.pdf', source_filename = 'MCDR_2017_updated_up_to_31January2026.pdf', status_note = 'Text as updated up to 31 Jan 2026 (IBM compilation).' where slug = 'mineral-conservation-development-rules-2017';
update public.regulations set source_url = 'https://ibm.gov.in/writereaddata/files/17836783416a50c585a846aMCR_2016__amended_upto_30th_March_2026.pdf', source_filename = 'MCR_2016__amended_upto_30th_March_2026.pdf', status_note = 'Text as amended up to 30 Mar 2026 (IBM compilation).' where slug = 'mineral-concession-rules-2016';
commit;

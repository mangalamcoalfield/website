-- ============================================================================
-- OPTIONAL demo seed — published rows so the data-driven pages show live data
-- before the real content track lands. Safe, public-domain placeholder content
-- only (obeys the publish-filter). Run AFTER schema.sql. Delete/replace before
-- launch — the brief requires killing every placeholder before go-live.
-- ============================================================================

-- jobs ----------------------------------------------------------------------
insert into public.jobs (title, dept, location, type, description, status, posted_at) values
  ('Mining Engineer (Underground)', 'Operations', 'Amlabad, Eastern Jharia, Jharkhand', 'Full-time',
   'Plan and supervise underground development and production in line with the Coal Mines Regulations 2017. Placeholder posting.', 'published', current_date - 20),
  ('Statutory Safety Officer', 'Safety & Compliance', 'Amlabad, Eastern Jharia, Jharkhand', 'Full-time',
   'Maintain statutory registers, gas-monitoring discipline and DGMS compliance across working districts. Placeholder posting.', 'published', current_date - 25),
  ('Electrical & Mechanical Foreman', 'Engineering', 'Amlabad, Eastern Jharia, Jharkhand', 'Full-time',
   'Maintain DGMS-approved equipment and statutory testing schedules for underground machinery. Placeholder posting.', 'published', current_date - 30);

-- csr_projects --------------------------------------------------------------
insert into public.csr_projects (title, category, status, description, published, date) values
  ('Community welfare around Amlabad', 'community', 'completed', 'Local engagement and welfare initiatives in the villages around the Amlabad block.', true, current_date - 60),
  ('Skill & safety training', 'safety', 'completed', 'Investment in workforce training and safety awareness for own and contractor labour.', true, current_date - 90),
  ('Green cover & reclamation', 'environment', 'planned', 'Plantation and land-care contributions in the mine vicinity (planned).', true, null),
  ('Water & environment management', 'environment', 'planned', 'Responsible water management and dust-control measures (planned).', true, null);

-- knowledge_entries ---------------------------------------------------------
insert into public.knowledge_entries (title, type, category, slug, body, source_url, published) values
  ('Bord & pillar mining, explained', 'explainer', 'operations', 'bord-and-pillar-mining',
   E'How underground coal is won and the ground kept stable.\n\nBord and pillar is the traditional underground method used across much of Indian coal mining: roadways (bords) are driven through the seam, leaving pillars of coal in place to support the roof. Placeholder explainer — the canonical article will be authored from the content track.', null, true),
  ('Mine gas & methane management', 'explainer', 'safety', 'mine-gas-and-methane-management',
   E'Gassiness, ventilation, and degasification — why air is everything underground.\n\nMethane is taught here as science. Site-specific gas readings are never published.', null, true),
  ('Coal grades & the National Coal Index', 'explainer', 'markets', 'coal-grades-and-the-national-coal-index',
   E'How Indian coal is graded and priced.\n\nThe National Coal Index (NCI) is published monthly by the Ministry of Coal and tracks price movement across coal grades. It is a monthly index, not a live price.', 'https://coal.nic.in', true),
  ('DGMS & the rules of the mine', 'reg_link', 'regulation', 'dgms-and-the-rules-of-the-mine',
   E'The statutory framework that governs Indian coal mining — DGMS, the Mines Act 1952, and the Coal Mines Regulations 2017.', 'https://www.dgms.gov.in', true);

-- nci_history ---------------------------------------------------------------
insert into public.nci_history (month, value, sub_index, source_url, published) values
  ('2026-04', 148.4, 'Non-coking · all-India', 'https://coal.nic.in', true),
  ('2026-03', 147.1, 'Non-coking · all-India', 'https://coal.nic.in', true);

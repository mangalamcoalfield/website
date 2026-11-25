-- Careers brought in line with the newspaper advert (25 Nov 2026), on the owner's instructions:
--  * New: Chartered Accountant (qualified CA). CA and CS are the top requirement.
--  * HR Manager is no longer advertised — taken down.
--  * Accounts Executive: B.Com / M.Com / CA Intermediate (IPCC), 2+ years.
--  * Store Manager: no degree requirement, 2+ years.
--  * Colliery Engineer (Mechanical): 5+ years, no upper limit.
--  * VTC Training Officer: 10+ years.

update public.jobs set status = 'archived'
where status = 'published' and title = 'HR Manager';

update public.jobs set description =
$$Keep the books for the colliery — day-to-day accounting and vouchers, vendor bills and payments, bank and ledger reconciliations, GST and TDS returns, payroll accounting support and month-end closing, working with the statutory auditors. Requirements: B.Com / M.Com or CA Intermediate (IPCC); 2+ years in accounts; working knowledge of Tally, GST and TDS; good MS Excel.$$
where status = 'published' and title = 'Accounts Executive';

update public.jobs set description =
$$Run the central stores for the whole site — mining, mechanical, electrical and administration — so no department is held up for want of material. Manage inventory of machinery spares, lubricants, diesel and consumables; forecast demand against operating schedules; prevent shortages and maintain stock discipline and records across departments. Requirements: 2+ years of store-management experience (mining / heavy engineering preferred); MS Excel proficiency.$$
where status = 'published' and title = 'Store Manager';

update public.jobs set description =
$$Oversee installation and maintenance of underground and surface machinery, ensure DGMS compliance and conduct safety inspections. Requirements: B.Tech / Diploma in Mechanical Engineering; Engineer's Certificate of Competency (Mechanical) for coal mines preferred; 5+ years of underground coal-mine experience; winder operations and dewatering systems knowledge.$$
where status = 'published' and title = 'Colliery Engineer (Mechanical)';

update public.jobs set description =
$$Take charge of the colliery's Vocational Training Centre under the Mines Vocational Training Rules, 1966 — basic, refresher and special training for every category of worker, trainee assessment and certificates, the training programme and records, and the annual report to the Chief Inspector (Rules 20–21). Requirements: B.Tech / Diploma in Mining Engineering; valid First Class Manager's Certificate of Competency (Coal) from DGMS (mandatory); 10+ years of underground coal-mining experience; experience of running or teaching at a VTC preferred; clear communicator in Hindi and English.$$
where status = 'published' and title = 'VTC Training Officer';

insert into public.jobs (title, dept, location, type, description, status, posted_at)
select 'Chartered Accountant (CA)', 'Admin', 'Amlabad, Eastern Jharia Area, District Bokaro, Jharkhand', 'Full-time',
$$Lead the company's finance function — books of account and financial statements, statutory and tax audits, income tax, GST and TDS compliance, budgeting and cash flow, and liaison with auditors and banks. Requirements: Qualified Chartered Accountant (member of ICAI); experience in accounts, taxation and audit; mining, infrastructure or manufacturing experience preferred.$$,
'published', date '2026-11-25'
where not exists (select 1 from public.jobs where title = 'Chartered Accountant (CA)' and status = 'published');

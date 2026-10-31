-- Hiring push, 31 Oct 2026: First Class manager role, Safety Officer, Accounts
-- Executive; every open role re-dated so job search engines treat it as current.
-- Targeted changes only (jobs_seed.sql archives everything and re-inserts, which
-- would orphan existing applications' job ids — do not use it for this).

-- 1. First Class Manager's Certificate role (new).
insert into public.jobs (title, dept, location, type, description, status, posted_at)
select 'Colliery Manager (Underground)', 'Mining', 'Amlabad, Eastern Jharia Area, District Bokaro, Jharkhand', 'Full-time',
$$Take overall charge of underground operations at Amlabad as the pits are revived and developed — mine planning, the safety management plan, statutory compliance under the Coal Mines Regulations 2017, and liaison with DGMS. Requirements: B.Tech / Diploma in Mining Engineering; valid First Class Manager's Certificate of Competency (Coal) from DGMS (mandatory); valid Gas Testing and First-Aid certificates; 10+ years underground coal-mining experience, including in a statutory managerial position; experience in gassy or fire-prone conditions and in mine development or revival preferred.$$,
'published', now()
where not exists (select 1 from public.jobs where title = 'Colliery Manager (Underground)' and status = 'published');

-- 2. "Safety Incharge" is advertised as Safety Officer (same role, same requirements).
update public.jobs
set title = 'Safety Officer',
    description = $$Lead safety at the colliery — inspections, accident and near-miss investigation, the safety management plan, safety training and statutory safety records across the working districts. Requirements: B.Tech / Diploma in Mining Engineering; valid First or Second Class Manager's Certificate of Competency from DGMS (mandatory); 5–8 years mining experience with 2+ years in safety.$$
where title = 'Safety Incharge' and status = 'published';

-- 3. Accounts Executive (new).
insert into public.jobs (title, dept, location, type, description, status, posted_at)
select 'Accounts Executive', 'Admin', 'Amlabad, Eastern Jharia Area, District Bokaro, Jharkhand', 'Full-time',
$$Keep the books for the colliery — day-to-day accounting and vouchers, vendor bills and payments, bank and ledger reconciliations, GST and TDS returns, payroll accounting support and month-end closing, working with the statutory auditors. Requirements: B.Com / M.Com; CA articleship experience strongly preferred (CA Inter a plus); 2–4 years in accounts; working knowledge of Tally, GST and TDS; good MS Excel.$$,
'published', now()
where not exists (select 1 from public.jobs where title = 'Accounts Executive' and status = 'published');

-- 4. Re-date every open role.
update public.jobs set posted_at = now() where status = 'published';

select title, dept, posted_at::date from public.jobs where status = 'published' order by dept, title;

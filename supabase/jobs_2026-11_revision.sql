-- Hiring push, revision (1 Nov 2026), on the owner's instructions:
--  * Colliery Manager and Assistant Colliery Manager are filled — taken down.
--  * First and Second Class Manager's Certificate holders are wanted as Mining
--    Engineers, several posts.
--  * Ventilation Officer now needs a Second Class Manager's Certificate.
--  * New: VTC Training Officer, First Class Manager's Certificate.

update public.jobs set status = 'archived'
where status = 'published' and title in ('Colliery Manager (Underground)', 'Assistant Colliery Manager (Underground)');

update public.jobs set description =
$$Several positions open. Lead underground development and extraction in your district — shift supervision, support and strata control, ventilation and gas management, statutory reporting and compliance with the Coal Mines Regulations 2017. Requirements: B.Tech / Diploma in Mining Engineering; valid First or Second Class Manager's Certificate of Competency (Coal) from DGMS (mandatory); minimum 3 years underground coal-mining experience; experience in gassy or fire-prone conditions preferred.$$
where status = 'published' and title = 'Mining Engineer (Underground)';

update public.jobs set description =
$$Plan, monitor and maintain the mine ventilation system — air-quantity and quality surveys, methane and gas monitoring, ventilation planning, and compliance with the ventilation provisions of the Coal Mines Regulations 2017. Requirements: B.Tech / Diploma in Mining Engineering; valid Second Class Manager's Certificate of Competency (Coal) from DGMS (mandatory); valid Gas Testing Certificate; sound knowledge of mine ventilation and methane management; underground coal-mining experience preferred.$$
where status = 'published' and title = 'Ventilation Officer';

insert into public.jobs (title, dept, location, type, description, status, posted_at)
select 'VTC Training Officer', 'Mining', 'Amlabad, Eastern Jharia Area, District Bokaro, Jharkhand', 'Full-time',
$$Take charge of the colliery's Vocational Training Centre under the Mines Vocational Training Rules, 1966 — basic, refresher and special training for every category of worker, trainee assessment and certificates, the training programme and records, and the annual report to the Chief Inspector (Rules 20–21). Requirements: B.Tech / Diploma in Mining Engineering; valid First Class Manager's Certificate of Competency (Coal) from DGMS (mandatory); underground coal-mining experience; experience of running or teaching at a VTC preferred; clear communicator in Hindi and English.$$,
'published', now()
where not exists (select 1 from public.jobs where title = 'VTC Training Officer' and status = 'published');

select title, dept, posted_at::date from public.jobs where status = 'published' order by dept, title;

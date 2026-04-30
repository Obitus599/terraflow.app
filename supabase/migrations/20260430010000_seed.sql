-- TerraFlow Operations · seed data
-- Idempotent — safe to re-run. Singletons use NOT EXISTS guards.
-- Hardcoded UUIDs so re-running on a populated DB is a no-op.

------------------------------------------------------------------------
-- 1. App settings singleton
------------------------------------------------------------------------
insert into public.app_settings (
    mrr_target_aed, mrr_target_month, min_cash_alarm_aed,
    max_bounce_rate, min_raj_completion_pct,
    owner_draw_pct, ashish_split_pct, morty_commission_pct
)
select 15000, '2026-10-31'::date, 10000, 0.05, 0.5, 0.4, 0.4, 0.1
where not exists (select 1 from public.app_settings);

------------------------------------------------------------------------
-- 2. Bank balance singleton (Alex sets this on first login)
------------------------------------------------------------------------
insert into public.bank_balance (current_aed)
select 0
where not exists (select 1 from public.bank_balance);

------------------------------------------------------------------------
-- 3. Clients — 4 active accounts
------------------------------------------------------------------------
insert into public.clients (id, name, client_type, monthly_aed, status, health, notes)
values
    ('c1000001-0000-4000-8000-000000000001', 'Ductly',           'recurring_pending', 0,    'active', 'yellow',
     'AED 3,000 build paid; maintenance contract in negotiation'),
    ('c1000001-0000-4000-8000-000000000002', 'Vortex Biotech',   'recurring',         1500, 'active', 'green', null),
    ('c1000001-0000-4000-8000-000000000003', 'Yako',             'recurring',         1500, 'active', 'green',
     'Combined billing with PCCT Petrocoat'),
    ('c1000001-0000-4000-8000-000000000004', 'PCCT Petrocoat',   'recurring',         0,    'active', 'green',
     'Included in Yako billing — not invoiced separately')
on conflict (id) do nothing;

------------------------------------------------------------------------
-- 4. Initial revenue entry — Ductly INV-001
------------------------------------------------------------------------
insert into public.revenue_entries (id, received_date, client_id, invoice_number, amount_aed, entry_type, notes)
values (
    'a1000001-0000-4000-8000-000000000001',
    '2026-04-15'::date,
    'c1000001-0000-4000-8000-000000000001',
    'INV-001',
    3000,
    'project',
    'staging.ductly.ae build paid in full'
)
on conflict (id) do nothing;

------------------------------------------------------------------------
-- 5. Pipeline deals — 33 UAE aesthetics prospects + Ductly maintenance
------------------------------------------------------------------------
insert into public.pipeline_deals (
    id, prospect_name, company, source, stage, confidence,
    expected_aed_monthly, expected_aed_one_time,
    expected_close_month, notes
)
values
    -- 33 cold email prospects, all at first_touch / pipe
    ('d1000001-0000-4000-8000-000000000001', 'Khaled Amairi',     'Clinica Reva Medical Group',                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO/Founder · khaled@revamedicalgroup.com · Dubai · 12 emp'),
    ('d1000001-0000-4000-8000-000000000002', 'Wajdi Daghma',      'AIG Clinics',                                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder/MD · wajdi.aldaghma@aigclinics.com · Dubai · 25 emp'),
    ('d1000001-0000-4000-8000-000000000003', 'Zita Desmet',       'Ouna Cosmetics',                                           'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder · zita@ounacosmetics.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000004', 'Fathi Baker',       'Medical Park Consultants One Day Surgery Center',         'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/CEO/ENT Surgeon · f.abubaker@mpc-uae.com · Abu Dhabi'),
    ('d1000001-0000-4000-8000-000000000005', 'Tarek Draki',       'ECLA Clinic',                                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder/CEO · tarekdraki@drc-intrl.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000006', 'Joseph Zgheib',     'Skinnovation',                                             'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO · joseph@skinnovation.me · Dubai · personalized email queued'),
    ('d1000001-0000-4000-8000-000000000007', 'Zarine Danielyan',  'Emerald Avenue Medical Clinic',                            'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO · zarine.danielyan@emeraldavenuemc.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000008', 'Assem Hanandeh',    'Al Raya Medical Center',                                   'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/CEO · assem@alrayamc.ae · Al Ain'),
    ('d1000001-0000-4000-8000-000000000009', 'Jissa Varghese',    'Phoenix Star Polyclinic',                                  'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder · jissa@phoenixstarclinics.ae · Dubai'),
    ('d1000001-0000-4000-8000-000000000010', 'Nashat Wali',       'WISEMED',                                                  'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/CEO · nashat.wali@wisemed.ae · Dubai'),
    ('d1000001-0000-4000-8000-000000000011', 'Dany Touma',        'Skin Experts Polyclinic',                                  'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/Lead Dermatologist · dtouma@skinexperts.ae · Dubai'),
    ('d1000001-0000-4000-8000-000000000012', 'Mohammad Marei',    'Dermaplus Clinic',                                         'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO · m.marei@dermaplus.ae · Dubai · personalized email queued'),
    ('d1000001-0000-4000-8000-000000000013', 'Nermine Hanna',     'Doclinia',                                                 'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/CEO · nermine.raouf@doclinia.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000014', 'Servane Collette',  'Invicta Med',                                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/MD · servane@invictamed.com · Dubai · personalized email queued'),
    ('d1000001-0000-4000-8000-000000000015', 'Fabio Menegon',     'Doctor Reuter Medical Centers',                            'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO/Co-Founder · fabio.menegon@dr-reuter.clinic · Dubai'),
    ('d1000001-0000-4000-8000-000000000016', 'Mariam Awatai',     'Dr. Mariam Awatai Clinic',                                 'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/Medical Director · mariam@drmariamawatai.com · Dubai · personalized email queued'),
    ('d1000001-0000-4000-8000-000000000017', 'Rania Hawayek',     'Circle Care Clinic',                                       'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/MD · rania@circlecareclinic.com · Dubai · 35 emp'),
    ('d1000001-0000-4000-8000-000000000018', 'Dina Sidani',       'ilik Health',                                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/CEO · dinasidani@ilikhealth.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000019', 'Tatiana Rusina',    'CIDK Clinic',                                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Deputy CEO · rusina@cidk.ru · Dubai'),
    ('d1000001-0000-4000-8000-000000000020', 'Yanina Mashukova',  'TURRI VIVE',                                               'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder/CEO · yana@turri-vive.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000021', 'Ali Qasqas',        'Dermaplus Clinic',                                         'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO Dermaplus Medical Center · ali@dermaplus.ae · Dubai'),
    ('d1000001-0000-4000-8000-000000000022', 'Antoine Pichery',   'aneeq',                                                    'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-founder/CEO · antoine.pichery@aneeq.co · Dubai'),
    ('d1000001-0000-4000-8000-000000000023', 'Mazin Turjman',     'Bloom Plus Medical Center',                                'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO/Owner · mazin.turjman@bloommc.ae · Abu Dhabi'),
    ('d1000001-0000-4000-8000-000000000024', 'Maria Karakoulaki', 'Gyneco Clinic',                                            'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder/CEO/Lead Aesthetic Gynaecologist · mk@gyneco.me · Dubai'),
    ('d1000001-0000-4000-8000-000000000025', 'Pegah Nehzati',     'The Reformery Aesthetic Clinic',                           'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder · pegah@thereformeryclinic.com · Dubai · personalized email queued'),
    ('d1000001-0000-4000-8000-000000000026', 'Shohreh Bagherian', 'Ivory Aesthetics Clinic Dubai',                            'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Owner · shohreh@ivoryaesthetics.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000027', 'Dilip Kumar',       'Rama Care Polyclinic',                                     'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Founder · kumar@ramacarepolyclinic.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000028', 'Ali Khazraji',      'Heart Beat Medical Center & One Day Surgery',              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO · ali@hbh.ae · Abu Dhabi · 48 emp'),
    ('d1000001-0000-4000-8000-000000000029', 'Delaram Rad',       'Elora Aesthetic Polyclinic',                               'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Owner · delaram@advancedaestheticslv.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000030', 'Neetu Nicholas',    'House of Wellness Polyclinic',                             'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO · neetu.nicholas@houseofwellness.ae · Dubai'),
    ('d1000001-0000-4000-8000-000000000031', 'Imdad Shah',        'GLAM SECRET',                                              'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'CEO · imdadshah@glam-secret.com · Dubai'),
    ('d1000001-0000-4000-8000-000000000032', 'Shahid Mir',        'Pristine Medical Center',                                  'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Co-Founder/Head of Business · shahid@pristinemedical.ae · Dubai'),
    ('d1000001-0000-4000-8000-000000000033', 'Hamdan Mazrouei',   'ISHRAQ CLINIC',                                            'cold_email', 'first_touch', 'pipe', 1500, 0, null, 'Owner · hamdan@ishraqclinic.ae · Dubai'),

    -- Ductly maintenance — already at proposal stage
    ('d1000001-0000-4000-8000-000000000099', 'Ductly maintenance', 'Ductly',                                                   'inbound',    'proposal_sent', 'best_case', 2000, 0, '2026-05-31'::date, 'Maintenance retainer follow-on to the AED 3,000 build paid 15-Apr')
on conflict (id) do nothing;

------------------------------------------------------------------------
-- 6. Cold email entries — 5 hand-personalized targets, not sent yet
------------------------------------------------------------------------
insert into public.cold_email_entries (
    id, prospect_name, company, email, subject, sent, opened, replied, bounced, booked_call, pipeline_deal_id, notes
)
values
    ('e1000001-0000-4000-8000-000000000001', 'Servane Collette', 'Invicta Med',                'servane@invictamed.com',     'Quick thought on Invicta Med',
        false, false, false, false, false, 'd1000001-0000-4000-8000-000000000014', 'Hand-personalized · Founding Clinic pitch'),
    ('e1000001-0000-4000-8000-000000000002', 'Joseph Zgheib',    'Skinnovation',               'joseph@skinnovation.me',     'Quick thought on Skinnovation',
        false, false, false, false, false, 'd1000001-0000-4000-8000-000000000006', 'Hand-personalized · Founding Clinic pitch'),
    ('e1000001-0000-4000-8000-000000000003', 'Mariam Awatai',    'Dr. Mariam Awatai Clinic',   'mariam@drmariamawatai.com',  'Quick thought on your clinic',
        false, false, false, false, false, 'd1000001-0000-4000-8000-000000000016', 'Hand-personalized · Founding Clinic pitch'),
    ('e1000001-0000-4000-8000-000000000004', 'Pegah Nehzati',    'The Reformery Aesthetic Clinic','pegah@thereformeryclinic.com','Quick thought on The Reformery',
        false, false, false, false, false, 'd1000001-0000-4000-8000-000000000025', 'Hand-personalized · Founding Clinic pitch'),
    ('e1000001-0000-4000-8000-000000000005', 'Mohammad Marei',   'Dermaplus Clinic',           'm.marei@dermaplus.ae',       'Quick thought on Dermaplus',
        false, false, false, false, false, 'd1000001-0000-4000-8000-000000000012', 'Hand-personalized · Founding Clinic pitch')
on conflict (id) do nothing;

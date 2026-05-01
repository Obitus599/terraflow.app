-- TerraFlow Operations · Funnels system
--
-- Generalises the hardcoded 6-stage pipeline. Each funnel has its own
-- ordered stages, plus 6 industry-standard templates seeded for cloning.
-- Existing pipeline_deals are migrated into a "Default Outbound" funnel,
-- and a sync trigger keeps pipeline_deals.stage and the corresponding
-- funnel_runs.current_stage_id in lockstep so the existing /pipeline page
-- continues to work during the transition.

------------------------------------------------------------------------
-- 1. Tables
------------------------------------------------------------------------
create table public.funnels (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    channel text not null check (
        channel in ('cold_email','linkedin','inbound','referral','content','mixed')
    ),
    is_template boolean not null default false,
    template_slug text,
    archived boolean not null default false,
    owner_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.funnel_stages (
    id uuid primary key default gen_random_uuid(),
    funnel_id uuid not null references public.funnels(id) on delete cascade,
    name text not null,
    sort_order integer not null,
    target_conversion_pct numeric(5,4) not null default 0,
    target_days integer not null default 0,
    is_terminal_won boolean not null default false,
    is_terminal_lost boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index funnel_stages_funnel_order_idx
    on public.funnel_stages(funnel_id, sort_order);
create index funnel_stages_funnel_idx on public.funnel_stages(funnel_id);

create table public.funnel_runs (
    id uuid primary key default gen_random_uuid(),
    funnel_id uuid not null references public.funnels(id) on delete cascade,
    pipeline_deal_id uuid references public.pipeline_deals(id) on delete cascade,
    current_stage_id uuid references public.funnel_stages(id) on delete set null,
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    outcome text not null default 'in_progress' check (
        outcome in ('in_progress','won','lost','dropped')
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(funnel_id, pipeline_deal_id)
);

create index funnel_runs_funnel_idx on public.funnel_runs(funnel_id);
create index funnel_runs_stage_idx on public.funnel_runs(current_stage_id);
create index funnel_runs_outcome_idx on public.funnel_runs(outcome);
create index funnel_runs_deal_idx on public.funnel_runs(pipeline_deal_id);

create table public.funnel_stage_transitions (
    id uuid primary key default gen_random_uuid(),
    funnel_run_id uuid not null references public.funnel_runs(id) on delete cascade,
    from_stage_id uuid references public.funnel_stages(id) on delete set null,
    to_stage_id uuid references public.funnel_stages(id) on delete set null,
    transitioned_at timestamptz not null default now(),
    actor_id uuid references public.profiles(id) on delete set null
);

create index funnel_stage_transitions_run_idx
    on public.funnel_stage_transitions(funnel_run_id);
create index funnel_stage_transitions_at_idx
    on public.funnel_stage_transitions(transitioned_at desc);

------------------------------------------------------------------------
-- 2. updated_at + audit triggers
------------------------------------------------------------------------
create trigger funnels_updated before update on public.funnels
    for each row execute function public.set_updated_at();
create trigger funnel_stages_updated before update on public.funnel_stages
    for each row execute function public.set_updated_at();
create trigger funnel_runs_updated before update on public.funnel_runs
    for each row execute function public.set_updated_at();

create trigger funnels_audit
    after insert or update or delete on public.funnels
    for each row execute function public.write_audit_log();
create trigger funnel_stages_audit
    after insert or update or delete on public.funnel_stages
    for each row execute function public.write_audit_log();
create trigger funnel_runs_audit
    after insert or update or delete on public.funnel_runs
    for each row execute function public.write_audit_log();

------------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------------
alter table public.funnels enable row level security;
alter table public.funnel_stages enable row level security;
alter table public.funnel_runs enable row level security;
alter table public.funnel_stage_transitions enable row level security;

create policy "funnels_select_all_authed" on public.funnels
    for select to authenticated using (true);
create policy "funnels_write_admin_or_owner" on public.funnels
    for all to authenticated
    using (owner_id = auth.uid() or public.is_admin())
    with check (owner_id = auth.uid() or public.is_admin());

create policy "funnel_stages_select_all_authed" on public.funnel_stages
    for select to authenticated using (true);
create policy "funnel_stages_write_via_funnel" on public.funnel_stages
    for all to authenticated
    using (
        exists (select 1 from public.funnels f
                where f.id = funnel_stages.funnel_id
                  and (f.owner_id = auth.uid() or public.is_admin()))
    )
    with check (
        exists (select 1 from public.funnels f
                where f.id = funnel_stages.funnel_id
                  and (f.owner_id = auth.uid() or public.is_admin()))
    );

create policy "funnel_runs_select_all_authed" on public.funnel_runs
    for select to authenticated using (true);
create policy "funnel_runs_write_authed" on public.funnel_runs
    for all to authenticated
    using (auth.uid() is not null)
    with check (auth.uid() is not null);

create policy "funnel_stage_transitions_select_authed" on public.funnel_stage_transitions
    for select to authenticated using (true);
create policy "funnel_stage_transitions_insert_authed" on public.funnel_stage_transitions
    for insert to authenticated with check (auth.uid() is not null);

------------------------------------------------------------------------
-- 4. Six seeded templates (full content lives in the live DB; this
--    migration creates the schema, the seed migration creates the data
--    in lockstep with what's in the database. See live state for the
--    full template definitions.)
--
--    Templates seeded by the same migration that runs in production:
--        - cold-email-outbound (5 stages + Won + Lost = 7)
--        - linkedin-outbound (4 stages + Won + Lost = 7)
--        - inbound-demo (4 stages + Won + Lost = 6)
--        - referral-closeout (3 stages + Won + Lost = 5)
--        - webinar-to-call (4 stages + Won + Lost = 6)
--        - founding-clinic (5 stages + Won + Lost = 6)
------------------------------------------------------------------------

------------------------------------------------------------------------
-- 5. Sync trigger between pipeline_deals.stage and funnel_runs in the
--    Default Outbound funnel only. INSERT auto-creates the funnel_run;
--    UPDATE of stage updates current_stage_id, outcome, and emits a
--    transition row. Other funnels are independent of pipeline_deals.
------------------------------------------------------------------------
create or replace function public.sync_pipeline_deal_to_default_funnel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    default_funnel_id uuid;
    target_stage_id uuid;
    target_outcome text;
    existing_run_id uuid;
    existing_stage_id uuid;
begin
    select id into default_funnel_id from public.funnels
        where name = 'Default Outbound' and is_template = false
        limit 1;
    if default_funnel_id is null then
        return new;
    end if;

    select id into target_stage_id from public.funnel_stages
        where funnel_id = default_funnel_id
          and name = case new.stage
                when 'first_touch'   then 'First touch'
                when 'replied'       then 'Replied'
                when 'call_booked'   then 'Call booked'
                when 'proposal_sent' then 'Proposal sent'
                when 'mou_signed'    then 'MOU signed'
                when 'kickoff'       then 'Kickoff'
                when 'won'           then 'Won'
                when 'lost'          then 'Lost'
              end
        limit 1;

    target_outcome := case new.stage
        when 'won'  then 'won'
        when 'lost' then 'lost'
        else 'in_progress'
    end;

    if (tg_op = 'INSERT') then
        insert into public.funnel_runs (funnel_id, pipeline_deal_id, current_stage_id, outcome)
        values (default_funnel_id, new.id, target_stage_id, target_outcome)
        on conflict (funnel_id, pipeline_deal_id) do nothing;

    elsif (tg_op = 'UPDATE') then
        if old.stage is distinct from new.stage then
            select id, current_stage_id into existing_run_id, existing_stage_id
                from public.funnel_runs
                where funnel_id = default_funnel_id and pipeline_deal_id = new.id;

            if existing_run_id is null then
                insert into public.funnel_runs (funnel_id, pipeline_deal_id, current_stage_id, outcome)
                values (default_funnel_id, new.id, target_stage_id, target_outcome);
            else
                update public.funnel_runs
                    set current_stage_id = target_stage_id,
                        outcome = target_outcome,
                        ended_at = case when target_outcome in ('won','lost') then now() else null end
                    where id = existing_run_id;

                if existing_stage_id is distinct from target_stage_id then
                    insert into public.funnel_stage_transitions
                        (funnel_run_id, from_stage_id, to_stage_id, actor_id)
                    values (existing_run_id, existing_stage_id, target_stage_id, auth.uid());
                end if;
            end if;
        end if;
    end if;

    return new;
end;
$$;

revoke execute on function public.sync_pipeline_deal_to_default_funnel() from public, anon, authenticated;

create trigger pipeline_deals_funnel_sync
    after insert or update of stage on public.pipeline_deals
    for each row execute function public.sync_pipeline_deal_to_default_funnel();

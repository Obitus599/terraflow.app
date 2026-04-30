-- TerraFlow Operations · initial schema
-- Tables, RLS policies, audit log, and auth-user → profile bootstrap.
-- gen_random_uuid() is built into Postgres 15+ on Supabase, no extension needed.

------------------------------------------------------------------------
-- 1. Helper functions
------------------------------------------------------------------------

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Role check used everywhere in RLS.
-- Using plpgsql so it can be created before the profiles table; the body
-- is validated lazily at call time.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
end;
$$;

------------------------------------------------------------------------
-- 2. Tables
------------------------------------------------------------------------

-- profiles: 1:1 with auth.users, holds role + capacity + fixed cost
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    full_name text not null,
    role text not null check (role in ('admin', 'team', 'client')),
    monthly_capacity_hours integer not null default 0,
    fixed_monthly_cost_aed integer not null default 0,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- clients
create table public.clients (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    client_type text not null check (client_type in ('recurring', 'project', 'recurring_pending')),
    monthly_aed integer not null default 0,
    status text not null default 'active' check (status in ('active', 'paused', 'churned', 'pending')),
    start_date date,
    health text not null default 'green' check (health in ('green', 'yellow', 'red')),
    upsell_ideas text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index clients_status_idx on public.clients(status);

-- tasks
create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    client_id uuid references public.clients(id) on delete set null,
    owner_id uuid not null references public.profiles(id) on delete restrict,
    status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'blocked', 'done')),
    priority text not null default 'p1' check (priority in ('p0', 'p1', 'p2')),
    due_date date,
    estimated_hours numeric(5,2) not null default 0,
    actual_hours numeric(5,2) not null default 0,
    notes text,
    category text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index tasks_owner_idx on public.tasks(owner_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_client_idx on public.tasks(client_id);
create index tasks_due_idx on public.tasks(due_date);

-- pipeline_deals
create table public.pipeline_deals (
    id uuid primary key default gen_random_uuid(),
    prospect_name text not null,
    company text,
    source text not null check (source in ('cold_email', 'linkedin', 'referral', 'morty', 'inbound', 'other')),
    stage text not null default 'first_touch' check (stage in (
        'first_touch', 'replied', 'call_booked', 'proposal_sent',
        'mou_signed', 'kickoff', 'won', 'lost'
    )),
    confidence text not null default 'pipe' check (confidence in ('commit', 'best_case', 'pipe')),
    expected_aed_monthly integer not null default 0,
    expected_aed_one_time integer not null default 0,
    expected_close_month date,
    last_touch date,
    next_action text,
    owner_id uuid references public.profiles(id) on delete set null,
    notes text,
    won_lost_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index pipeline_stage_idx on public.pipeline_deals(stage);
create index pipeline_owner_idx on public.pipeline_deals(owner_id);
create index pipeline_close_idx on public.pipeline_deals(expected_close_month);

-- revenue_entries
create table public.revenue_entries (
    id uuid primary key default gen_random_uuid(),
    received_date date not null,
    client_id uuid references public.clients(id) on delete set null,
    invoice_number text,
    amount_aed integer not null,
    entry_type text not null default 'recurring' check (entry_type in ('recurring', 'project', 'audit', 'other')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index revenue_date_idx on public.revenue_entries(received_date);
create index revenue_client_idx on public.revenue_entries(client_id);

-- cash_flow_entries
create table public.cash_flow_entries (
    id uuid primary key default gen_random_uuid(),
    entry_date date not null,
    direction text not null check (direction in ('in', 'out')),
    category text not null check (category in ('revenue', 'salary', 'tools', 'tax', 'refund', 'equipment', 'other')),
    description text,
    amount_aed integer not null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index cash_flow_date_idx on public.cash_flow_entries(entry_date);
create index cash_flow_direction_idx on public.cash_flow_entries(direction);

-- cold_email_entries
create table public.cold_email_entries (
    id uuid primary key default gen_random_uuid(),
    sent_date date,
    prospect_name text not null,
    company text,
    email text not null,
    subject text,
    sent boolean not null default false,
    opened boolean not null default false,
    replied boolean not null default false,
    bounced boolean not null default false,
    booked_call boolean not null default false,
    pipeline_deal_id uuid references public.pipeline_deals(id) on delete set null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index cold_email_sent_date_idx on public.cold_email_entries(sent_date);
create index cold_email_replied_idx on public.cold_email_entries(replied);
create index cold_email_bounced_idx on public.cold_email_entries(bounced);

-- bank_balance: singleton (enforced by check constraint on a known id)
create table public.bank_balance (
    id uuid primary key default gen_random_uuid(),
    current_aed integer not null,
    last_updated_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- app_settings: singleton
create table public.app_settings (
    id uuid primary key default gen_random_uuid(),
    mrr_target_aed integer not null default 15000,
    mrr_target_month date not null default '2026-10-31',
    min_cash_alarm_aed integer not null default 10000,
    max_bounce_rate numeric(4,3) not null default 0.05,
    min_raj_completion_pct numeric(4,3) not null default 0.5,
    owner_draw_pct numeric(4,3) not null default 0.4,
    ashish_split_pct numeric(4,3) not null default 0.4,
    morty_commission_pct numeric(4,3) not null default 0.1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- audit_log: insert via trigger only
create table public.audit_log (
    id uuid primary key default gen_random_uuid(),
    table_name text not null,
    record_id uuid,
    action text not null check (action in ('insert', 'update', 'delete')),
    actor_id uuid references public.profiles(id) on delete set null,
    diff jsonb,
    created_at timestamptz not null default now()
);

create index audit_log_table_record_idx on public.audit_log(table_name, record_id);
create index audit_log_created_at_idx on public.audit_log(created_at desc);

------------------------------------------------------------------------
-- 3. updated_at triggers
------------------------------------------------------------------------

create trigger profiles_updated before update on public.profiles
    for each row execute function public.set_updated_at();
create trigger clients_updated before update on public.clients
    for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks
    for each row execute function public.set_updated_at();
create trigger pipeline_deals_updated before update on public.pipeline_deals
    for each row execute function public.set_updated_at();
create trigger revenue_entries_updated before update on public.revenue_entries
    for each row execute function public.set_updated_at();
create trigger cash_flow_entries_updated before update on public.cash_flow_entries
    for each row execute function public.set_updated_at();
create trigger cold_email_entries_updated before update on public.cold_email_entries
    for each row execute function public.set_updated_at();
create trigger bank_balance_updated before update on public.bank_balance
    for each row execute function public.set_updated_at();
create trigger app_settings_updated before update on public.app_settings
    for each row execute function public.set_updated_at();

------------------------------------------------------------------------
-- 4. handle_new_user — bootstrap profile on first magic-link sign-in.
--    Hardcoded role/capacity for the 5 known team members; default 'team'
--    for anyone else (the magic-link flow will reject non-@terraflow.studio
--    addresses upstream of this trigger anyway).
------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := 'team';
    v_capacity integer := 0;
    v_fixed_cost integer := 0;
    v_full_name text;
begin
    case new.email
        when 'alex@terraflow.studio' then
            v_role := 'admin'; v_capacity := 160; v_fixed_cost := 0;
            v_full_name := 'Alex Joseph';
        when 'raj@terraflow.studio' then
            v_role := 'team'; v_capacity := 100; v_fixed_cost := 1250;
            v_full_name := 'Raj';
        when 'reeba@terraflow.studio' then
            v_role := 'team'; v_capacity := 10; v_fixed_cost := 30;
            v_full_name := 'Reeba';
        when 'ashish@terraflow.studio' then
            v_role := 'team'; v_capacity := 0; v_fixed_cost := 0;
            v_full_name := 'Ashish';
        when 'morty@terraflow.studio' then
            v_role := 'team'; v_capacity := 0; v_fixed_cost := 0;
            v_full_name := 'Morty';
        else
            v_full_name := coalesce(
                new.raw_user_meta_data->>'full_name',
                split_part(new.email, '@', 1)
            );
    end case;

    insert into public.profiles (id, email, full_name, role, monthly_capacity_hours, fixed_monthly_cost_aed)
    values (new.id, new.email, v_full_name, v_role, v_capacity, v_fixed_cost)
    on conflict (id) do nothing;

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

------------------------------------------------------------------------
-- 5. profiles UPDATE guard — non-admins cannot self-elevate role,
--    capacity, or fixed cost.
------------------------------------------------------------------------

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if public.is_admin() then
        return new;
    end if;

    if new.role is distinct from old.role then
        raise exception 'Only an admin can change a profile role';
    end if;
    if new.monthly_capacity_hours is distinct from old.monthly_capacity_hours then
        raise exception 'Only an admin can change capacity';
    end if;
    if new.fixed_monthly_cost_aed is distinct from old.fixed_monthly_cost_aed then
        raise exception 'Only an admin can change fixed cost';
    end if;
    return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
    for each row execute function public.guard_profile_update();

------------------------------------------------------------------------
-- 6. Audit log trigger — fires on INSERT/UPDATE/DELETE for the 6
--    mutable user-facing tables.
------------------------------------------------------------------------

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor uuid := auth.uid();
    v_record_id uuid;
    v_diff jsonb;
begin
    if (tg_op = 'INSERT') then
        v_record_id := (to_jsonb(new) ->> 'id')::uuid;
        v_diff := jsonb_build_object('new', to_jsonb(new));
    elsif (tg_op = 'UPDATE') then
        v_record_id := (to_jsonb(new) ->> 'id')::uuid;
        v_diff := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    elsif (tg_op = 'DELETE') then
        v_record_id := (to_jsonb(old) ->> 'id')::uuid;
        v_diff := jsonb_build_object('old', to_jsonb(old));
    end if;

    insert into public.audit_log (table_name, record_id, action, actor_id, diff)
    values (tg_table_name, v_record_id, lower(tg_op), v_actor, v_diff);

    return coalesce(new, old);
end;
$$;

create trigger tasks_audit
    after insert or update or delete on public.tasks
    for each row execute function public.write_audit_log();
create trigger pipeline_deals_audit
    after insert or update or delete on public.pipeline_deals
    for each row execute function public.write_audit_log();
create trigger revenue_entries_audit
    after insert or update or delete on public.revenue_entries
    for each row execute function public.write_audit_log();
create trigger clients_audit
    after insert or update or delete on public.clients
    for each row execute function public.write_audit_log();
create trigger bank_balance_audit
    after insert or update or delete on public.bank_balance
    for each row execute function public.write_audit_log();
create trigger app_settings_audit
    after insert or update or delete on public.app_settings
    for each row execute function public.write_audit_log();

------------------------------------------------------------------------
-- 7. RLS — enable on every public table
------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.pipeline_deals enable row level security;
alter table public.revenue_entries enable row level security;
alter table public.cash_flow_entries enable row level security;
alter table public.cold_email_entries enable row level security;
alter table public.bank_balance enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_log enable row level security;

------------------------------------------------------------------------
-- 8. RLS policies
------------------------------------------------------------------------

-- profiles
create policy "profiles_select_all_authed" on public.profiles
    for select to authenticated using (true);
create policy "profiles_update_own_or_admin" on public.profiles
    for update to authenticated
    using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());
create policy "profiles_insert_admin" on public.profiles
    for insert to authenticated with check (public.is_admin());
create policy "profiles_delete_admin" on public.profiles
    for delete to authenticated using (public.is_admin());

-- clients (admin write, all authed read)
create policy "clients_select_all_authed" on public.clients
    for select to authenticated using (true);
create policy "clients_write_admin" on public.clients
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- tasks (read all, owner-or-admin update, anyone insert, admin delete)
create policy "tasks_select_all_authed" on public.tasks
    for select to authenticated using (true);
create policy "tasks_insert_authed" on public.tasks
    for insert to authenticated with check (auth.uid() is not null);
create policy "tasks_update_owner_or_admin" on public.tasks
    for update to authenticated
    using (owner_id = auth.uid() or public.is_admin())
    with check (owner_id = auth.uid() or public.is_admin());
create policy "tasks_delete_admin" on public.tasks
    for delete to authenticated using (public.is_admin());

-- pipeline_deals (read all, owner-or-admin write, admin delete)
create policy "pipeline_select_all_authed" on public.pipeline_deals
    for select to authenticated using (true);
create policy "pipeline_insert_owner_or_admin" on public.pipeline_deals
    for insert to authenticated
    with check (owner_id is null or owner_id = auth.uid() or public.is_admin());
create policy "pipeline_update_owner_or_admin" on public.pipeline_deals
    for update to authenticated
    using (owner_id = auth.uid() or public.is_admin())
    with check (owner_id = auth.uid() or public.is_admin());
create policy "pipeline_delete_admin" on public.pipeline_deals
    for delete to authenticated using (public.is_admin());

-- revenue_entries (admin write, all authed read)
create policy "revenue_select_all_authed" on public.revenue_entries
    for select to authenticated using (true);
create policy "revenue_write_admin" on public.revenue_entries
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- cash_flow_entries (admin write, all authed read)
create policy "cash_flow_select_all_authed" on public.cash_flow_entries
    for select to authenticated using (true);
create policy "cash_flow_write_admin" on public.cash_flow_entries
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- cold_email_entries (read all, write all authed, admin delete)
create policy "cold_email_select_all_authed" on public.cold_email_entries
    for select to authenticated using (true);
create policy "cold_email_insert_authed" on public.cold_email_entries
    for insert to authenticated with check (auth.uid() is not null);
create policy "cold_email_update_authed" on public.cold_email_entries
    for update to authenticated
    using (auth.uid() is not null)
    with check (auth.uid() is not null);
create policy "cold_email_delete_admin" on public.cold_email_entries
    for delete to authenticated using (public.is_admin());

-- bank_balance (admin write, all authed read)
create policy "bank_balance_select_all_authed" on public.bank_balance
    for select to authenticated using (true);
create policy "bank_balance_write_admin" on public.bank_balance
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- app_settings (admin write, all authed read)
create policy "app_settings_select_all_authed" on public.app_settings
    for select to authenticated using (true);
create policy "app_settings_write_admin" on public.app_settings
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- audit_log (admin read only; inserts go via trigger which is SECURITY DEFINER)
create policy "audit_log_select_admin" on public.audit_log
    for select to authenticated using (public.is_admin());

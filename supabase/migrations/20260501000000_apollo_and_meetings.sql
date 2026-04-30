-- TerraFlow Operations · Apollo + Meetings
-- Apollo data is synced from the Apollo API (manually for now via the
-- "Sync now" button in /cold-email; the migration creates the schema, not
-- the data). Meetings are user-created today; Google Calendar sync hooks
-- into the external_event_id / external_calendar_id columns later.

------------------------------------------------------------------------
-- 1. apollo_sequences — snapshot of Apollo emailer campaigns
------------------------------------------------------------------------
create table public.apollo_sequences (
    id text primary key,
    name text not null,
    active boolean not null default false,
    archived boolean not null default false,
    num_steps integer not null default 0,
    unique_scheduled integer not null default 0,
    unique_delivered integer not null default 0,
    unique_bounced integer not null default 0,
    unique_hard_bounced integer not null default 0,
    unique_opened integer not null default 0,
    unique_replied integer not null default 0,
    unique_clicked integer not null default 0,
    unique_spam_blocked integer not null default 0,
    unique_unsubscribed integer not null default 0,
    open_rate numeric(5,4) not null default 0,
    bounce_rate numeric(5,4) not null default 0,
    reply_rate numeric(5,4) not null default 0,
    click_rate numeric(5,4) not null default 0,
    spam_block_rate numeric(5,4) not null default 0,
    is_performing_poorly boolean not null default false,
    creation_type text,
    created_at_apollo timestamptz,
    last_used_at timestamptz,
    synced_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index apollo_sequences_active_idx on public.apollo_sequences(active);
create index apollo_sequences_last_used_idx on public.apollo_sequences(last_used_at desc);

------------------------------------------------------------------------
-- 2. apollo_email_accounts — connected mailboxes + provider/health
------------------------------------------------------------------------
create table public.apollo_email_accounts (
    id text primary key,
    email text not null,
    provider text not null,
    active boolean not null default true,
    is_default boolean not null default false,
    created_at_apollo timestamptz,
    last_synced_at_apollo timestamptz,
    synced_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

------------------------------------------------------------------------
-- 3. meetings — internal calendar (manual entry today, future Google sync)
------------------------------------------------------------------------
create table public.meetings (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    location text,
    attendees text,
    pipeline_deal_id uuid references public.pipeline_deals(id) on delete set null,
    client_id uuid references public.clients(id) on delete set null,
    owner_id uuid not null references public.profiles(id) on delete restrict,
    external_event_id text,
    external_calendar_id text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index meetings_starts_at_idx on public.meetings(starts_at);
create index meetings_owner_idx on public.meetings(owner_id);
create index meetings_deal_idx on public.meetings(pipeline_deal_id);
create index meetings_client_idx on public.meetings(client_id);

------------------------------------------------------------------------
-- 4. updated_at + audit triggers
------------------------------------------------------------------------
create trigger apollo_sequences_updated before update on public.apollo_sequences
    for each row execute function public.set_updated_at();
create trigger apollo_email_accounts_updated before update on public.apollo_email_accounts
    for each row execute function public.set_updated_at();
create trigger meetings_updated before update on public.meetings
    for each row execute function public.set_updated_at();

create trigger meetings_audit
    after insert or update or delete on public.meetings
    for each row execute function public.write_audit_log();

------------------------------------------------------------------------
-- 5. RLS
------------------------------------------------------------------------
alter table public.apollo_sequences enable row level security;
alter table public.apollo_email_accounts enable row level security;
alter table public.meetings enable row level security;

create policy "apollo_sequences_select_all_authed" on public.apollo_sequences
    for select to authenticated using (true);
create policy "apollo_sequences_write_admin" on public.apollo_sequences
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "apollo_email_accounts_select_all_authed" on public.apollo_email_accounts
    for select to authenticated using (true);
create policy "apollo_email_accounts_write_admin" on public.apollo_email_accounts
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "meetings_select_all_authed" on public.meetings
    for select to authenticated using (true);
create policy "meetings_insert_authed" on public.meetings
    for insert to authenticated with check (auth.uid() is not null);
create policy "meetings_update_owner_or_admin" on public.meetings
    for update to authenticated
    using (owner_id = auth.uid() or public.is_admin())
    with check (owner_id = auth.uid() or public.is_admin());
create policy "meetings_delete_owner_or_admin" on public.meetings
    for delete to authenticated
    using (owner_id = auth.uid() or public.is_admin());

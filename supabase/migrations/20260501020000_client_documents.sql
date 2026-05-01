-- TerraFlow Operations · Client documents
--
-- Per-client file holder with categories. Files live in a private
-- storage bucket; the client_documents table tracks metadata so we
-- can list/group/delete without enumerating storage.

------------------------------------------------------------------------
-- 1. Storage bucket
------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'client-documents',
    'client-documents',
    false,
    26214400, -- 25 MB per file
    array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/svg+xml',
        'text/plain',
        'text/csv'
    ]
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

------------------------------------------------------------------------
-- 2. Storage RLS — any authed user can read/write/delete inside the
--    bucket. Per-client write authorization is enforced at the table
--    level via the client_documents row insert; we rely on the table
--    being the source of truth and the storage path being a derived
--    artifact.
------------------------------------------------------------------------
create policy "client_documents_storage_select"
    on storage.objects for select to authenticated
    using (bucket_id = 'client-documents');

create policy "client_documents_storage_insert"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'client-documents');

create policy "client_documents_storage_update"
    on storage.objects for update to authenticated
    using (bucket_id = 'client-documents')
    with check (bucket_id = 'client-documents');

create policy "client_documents_storage_delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'client-documents');

------------------------------------------------------------------------
-- 3. client_documents table
------------------------------------------------------------------------
create table public.client_documents (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    category text not null check (
        category in ('contracts','proposals','onboarding','deliverables','misc')
    ),
    name text not null,
    storage_path text not null unique,
    size_bytes bigint not null,
    mime_type text,
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create index client_documents_client_idx on public.client_documents(client_id);
create index client_documents_category_idx on public.client_documents(client_id, category);
create index client_documents_created_at_idx on public.client_documents(created_at desc);

create trigger client_documents_audit
    after insert or update or delete on public.client_documents
    for each row execute function public.write_audit_log();

------------------------------------------------------------------------
-- 4. Table RLS — read for any authed user; write/delete for any
--    authed user (uploader tracked for audit + delete attribution).
--    Mirrors how clients themselves are managed (no per-client owner).
------------------------------------------------------------------------
alter table public.client_documents enable row level security;

create policy "client_documents_select_all_authed"
    on public.client_documents for select to authenticated
    using (true);

create policy "client_documents_insert_authed"
    on public.client_documents for insert to authenticated
    with check (auth.uid() is not null);

create policy "client_documents_delete_uploader_or_admin"
    on public.client_documents for delete to authenticated
    using (uploaded_by = auth.uid() or public.is_admin());

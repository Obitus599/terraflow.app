-- TerraFlow Operations · security hardening
-- Addresses Supabase advisor warnings:
--   1) "Function public.set_updated_at has a role mutable search_path"
--      → set explicit empty search_path so the function can't be tricked
--        into resolving names through a malicious schema.
--   2) "Function public.is_admin() can be executed by the anon/
--      authenticated role as a SECURITY DEFINER function"
--      → switch to SECURITY INVOKER. It only ever needs to read the
--        caller's own profile, which the RLS select-all policy already
--        permits.
--   3) Trigger-only SECURITY DEFINER functions (guard_profile_update,
--      handle_new_user, write_audit_log) → revoke EXECUTE from public,
--      anon, and authenticated. The trigger system invokes them
--      regardless of caller permissions.

------------------------------------------------------------------------
-- 1. set_updated_at — pin search_path
------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

------------------------------------------------------------------------
-- 2. is_admin — switch to SECURITY INVOKER
--    Reads only the caller's own profile row, which the existing
--    profiles_select_all_authed policy already permits for authenticated
--    users.
------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
end;
$$;

------------------------------------------------------------------------
-- 3. Revoke EXECUTE on trigger-only SECURITY DEFINER functions
------------------------------------------------------------------------
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.handle_new_user()       from public, anon, authenticated;
revoke execute on function public.write_audit_log()        from public, anon, authenticated;

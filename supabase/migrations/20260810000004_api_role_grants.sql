-- PostgREST roles need explicit privileges before RLS policies are evaluated.
-- Local Supabase now defaults to not auto-exposing new public tables, so keep
-- grants aligned with the app's server actions and browser reads.

grant usage on schema public to anon, authenticated, service_role;

grant select on table
    public.profile,
    public.segments,
    public.templates,
    public.contacts,
    public.campaigns,
    public.messages,
    public.processed_webhook_events
to authenticated;

grant insert, update on table public.profile to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

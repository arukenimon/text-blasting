-- RLS policies decide which rows authenticated users may read, but Postgres
-- also requires table privileges before those policies are evaluated.

grant usage on schema public to authenticated;

grant select on table
    public.profile,
    public.segments,
    public.contacts
to authenticated;

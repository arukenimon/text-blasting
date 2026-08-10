-- Let authenticated users create audience segments without granting direct
-- table-wide write access. Used by the admin UI's Add Contact/New Segment flow.

create or replace function public.create_segment_for_authenticated(
    segment_name text,
    segment_description text default null,
    segment_color_hex text default '#6366f1'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    new_segment_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    if length(trim(coalesce(segment_name, ''))) < 2 then
        raise exception 'Segment name must be at least 2 characters long.';
    end if;

    if coalesce(segment_color_hex, '') !~ '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$' then
        raise exception 'Invalid hex color code.';
    end if;

    insert into public.segments (name, description, color_hex)
    values (
        trim(segment_name),
        nullif(trim(coalesce(segment_description, '')), ''),
        segment_color_hex
    )
    returning id into new_segment_id;

    return new_segment_id;
end;
$$;

revoke all on function public.create_segment_for_authenticated(text, text, text) from public;
grant execute on function public.create_segment_for_authenticated(text, text, text) to authenticated;

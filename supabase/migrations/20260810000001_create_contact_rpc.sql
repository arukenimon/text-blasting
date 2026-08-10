-- Let authenticated users add a contact through a narrow RPC instead of
-- requiring direct contacts table insert privileges from the UI.

create or replace function public.create_contact_for_authenticated(
    contact_name text,
    contact_phone_no text,
    contact_segment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    new_contact_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    if length(trim(coalesce(contact_name, ''))) < 2 then
        raise exception 'Name must be at least 2 characters long.';
    end if;

    if coalesce(contact_phone_no, '') !~ '^\d{7,}$' then
        raise exception 'Phone number must contain at least 7 digits.';
    end if;

    if not exists (select 1 from public.segments where id = contact_segment_id) then
        raise exception 'Selected segment does not exist.';
    end if;

    insert into public.contacts (full_name, phone_no, status, segment_id)
    values (
        trim(contact_name),
        contact_phone_no::bigint,
        'active',
        contact_segment_id
    )
    returning id into new_contact_id;

    return new_contact_id;
end;
$$;

revoke all on function public.create_contact_for_authenticated(text, text, uuid) from public;
grant execute on function public.create_contact_for_authenticated(text, text, uuid) to authenticated;

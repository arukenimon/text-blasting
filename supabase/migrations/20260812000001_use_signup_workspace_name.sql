-- New signups may provide a desired workspace display name in auth metadata.
-- The stable workspace slug stays derived from the user id.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    new_workspace_id uuid;
    workspace_name text;
begin
    workspace_name := nullif(
        left(
            trim(
                regexp_replace(
                    coalesce(new.raw_user_meta_data ->> 'workspace_name', ''),
                    '\s+',
                    ' ',
                    'g'
                )
            ),
            80
        ),
        ''
    );

    if workspace_name is null then
        workspace_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'Personal') || ' Workspace';
    end if;

    insert into public.workspaces (name, slug, created_by)
    values (
        workspace_name,
        'personal-' || left(new.id::text, 8),
        new.id
    )
    returning id into new_workspace_id;

    insert into public.profile (id, active_workspace_id)
    values (new.id, new_workspace_id)
    on conflict (id) do update
        set active_workspace_id = coalesce(public.profile.active_workspace_id, excluded.active_workspace_id);

    insert into public.workspace_members (workspace_id, user_id, user_email, role)
    values (new_workspace_id, new.id, new.email, 'owner')
    on conflict (workspace_id, user_id) do nothing;

    insert into public.workspace_sms_gateway (workspace_id)
    values (new_workspace_id)
    on conflict (workspace_id) do nothing;

    return new;
end;
$$;

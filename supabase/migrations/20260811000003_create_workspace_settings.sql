-- Legacy global key/value settings no longer fit the workspace tenant model.
-- Create a workspace-scoped settings table and preserve any existing global
-- settings data. The old public.settings table is intentionally left intact
-- until an explicit destructive cleanup is approved.

create table if not exists workspace_settings (
    workspace_id uuid not null references workspaces(id) on delete cascade,
    key          text not null,
    value        jsonb not null default '{}',
    updated_at   timestamptz not null default now(),
    primary key (workspace_id, key)
);

drop trigger if exists workspace_settings_updated_at on workspace_settings;
create trigger workspace_settings_updated_at
    before update on workspace_settings
    for each row execute procedure set_updated_at();

insert into workspace_settings (workspace_id, key, value)
select w.id, s.key, s.value
from workspaces w
cross join settings s
where to_regclass('public.settings') is not null
on conflict (workspace_id, key) do nothing;

alter table workspace_settings enable row level security;

drop policy if exists "workspace_settings member read" on workspace_settings;
create policy "workspace_settings member read" on workspace_settings
    for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_settings admin write" on workspace_settings;
create policy "workspace_settings admin write" on workspace_settings
    for all to authenticated
    using (public.has_workspace_role(workspace_id, 'admin'))
    with check (public.has_workspace_role(workspace_id, 'admin'));

grant select on table public.workspace_settings to authenticated;
grant all privileges on table public.workspace_settings to service_role;

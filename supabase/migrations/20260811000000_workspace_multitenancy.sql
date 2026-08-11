-- Workspace tenancy, shared gateway ownership, team invitations, and
-- workspace-scoped RLS for campaign data.

create extension if not exists pgcrypto;

create table if not exists workspaces (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    slug        text not null unique,
    created_by  uuid references auth.users(id) on delete set null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz default now()
);

create table if not exists workspace_members (
    workspace_id uuid not null references workspaces(id) on delete cascade,
    user_id      uuid not null references auth.users(id) on delete cascade,
    user_email   text,
    role         text not null check (role in ('owner','admin','member')),
    joined_at    timestamptz not null default now(),
    primary key (workspace_id, user_id)
);

create table if not exists workspace_invitations (
    id           uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    email        text not null,
    role         text not null check (role in ('admin','member')),
    token        uuid not null unique default gen_random_uuid(),
    status       text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
    expires_at   timestamptz not null default (now() + interval '7 days'),
    invited_by   uuid references auth.users(id) on delete set null,
    accepted_by  uuid references auth.users(id) on delete set null,
    accepted_at  timestamptz,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz default now()
);

create unique index if not exists workspace_invitations_pending_email_idx
    on workspace_invitations (workspace_id, lower(email))
    where status = 'pending';

create table if not exists workspace_sms_gateway (
    workspace_id          uuid primary key references workspaces(id) on delete cascade,
    mode                  text not null default 'cloud' check (mode in ('local','cloud')),
    sim_slot              int default 1,
    local_server          jsonb,
    cloud_server          jsonb,
    webhook_token         uuid not null default gen_random_uuid(),
    webhook_secret        text not null default encode(gen_random_bytes(32),'hex'),
    webhook_registrations jsonb not null default '{}'::jsonb,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz default now()
);

create unique index if not exists workspace_sms_gateway_webhook_token_idx
    on workspace_sms_gateway (webhook_token);

alter table profile
    add column if not exists active_workspace_id uuid references workspaces(id) on delete set null;

alter table segments
    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table templates
    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table contacts
    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table campaigns
    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table messages
    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table processed_webhook_events
    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

do $$
declare
    legacy_id uuid;
    owner_id uuid;
begin
    select id into owner_id from auth.users order by created_at asc limit 1;

    select id into legacy_id from public.workspaces where slug = 'legacy-workspace';
    if legacy_id is null then
        insert into public.workspaces (name, slug, created_by)
        values ('Legacy Workspace', 'legacy-workspace', owner_id)
        returning id into legacy_id;
    end if;

    insert into public.workspace_members (workspace_id, user_id, user_email, role)
    select
        legacy_id,
        u.id,
        u.email,
        case when u.id = owner_id then 'owner' else 'admin' end
    from auth.users u
    on conflict (workspace_id, user_id) do update
        set user_email = excluded.user_email;

    update public.profile
    set active_workspace_id = legacy_id
    where active_workspace_id is null
      and exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = legacy_id and wm.user_id = profile.id
      );

    update public.segments set workspace_id = legacy_id where workspace_id is null;
    update public.templates set workspace_id = legacy_id where workspace_id is null;
    update public.contacts set workspace_id = legacy_id where workspace_id is null;
    update public.campaigns set workspace_id = legacy_id where workspace_id is null;
    update public.messages set workspace_id = legacy_id where workspace_id is null;
    update public.processed_webhook_events set workspace_id = legacy_id where workspace_id is null;

    insert into public.workspace_sms_gateway (
        workspace_id,
        mode,
        sim_slot,
        local_server,
        cloud_server,
        webhook_secret,
        webhook_registrations
    )
    select
        legacy_id,
        coalesce(p.mode, 'cloud'),
        coalesce(p.sim_slot, 1),
        p.local_server,
        p.cloud_server,
        coalesce(p.webhook_secret, encode(gen_random_bytes(32),'hex')),
        coalesce(p.webhook_registrations, '{}'::jsonb)
    from public.profile p
    where p.id = owner_id
    on conflict (workspace_id) do nothing;

    insert into public.workspace_sms_gateway (workspace_id)
    values (legacy_id)
    on conflict (workspace_id) do nothing;
end $$;

alter table segments alter column workspace_id set not null;
alter table templates alter column workspace_id set not null;
alter table contacts alter column workspace_id set not null;
alter table campaigns alter column workspace_id set not null;
alter table messages alter column workspace_id set not null;
alter table processed_webhook_events alter column workspace_id set not null;

alter table messages alter column user_id drop not null;
alter table processed_webhook_events drop constraint if exists processed_webhook_events_pkey;
alter table processed_webhook_events alter column user_id drop not null;
alter table processed_webhook_events
    add constraint processed_webhook_events_pkey primary key (workspace_id, gateway_event_id);

alter table messages drop constraint if exists messages_user_id_fkey;
alter table messages
    add constraint messages_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

create index if not exists segments_workspace_idx on segments (workspace_id);
create index if not exists templates_workspace_idx on templates (workspace_id);
create index if not exists contacts_workspace_idx on contacts (workspace_id);
create index if not exists campaigns_workspace_idx on campaigns (workspace_id, created_at desc);
create index if not exists messages_workspace_campaign_idx on messages (workspace_id, campaign_id);
create index if not exists messages_workspace_gateway_recipient_idx
    on messages (workspace_id, gateway_message_id, phone_no)
    where gateway_message_id is not null;
create index if not exists processed_webhook_events_workspace_idx
    on processed_webhook_events (workspace_id, received_at desc);

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at
    before update on workspaces
    for each row execute procedure set_updated_at();

drop trigger if exists workspace_invitations_updated_at on workspace_invitations;
create trigger workspace_invitations_updated_at
    before update on workspace_invitations
    for each row execute procedure set_updated_at();

drop trigger if exists workspace_sms_gateway_updated_at on workspace_sms_gateway;
create trigger workspace_sms_gateway_updated_at
    before update on workspace_sms_gateway
    for each row execute procedure set_updated_at();

create or replace function public.workspace_role_rank(role_name text)
returns int
language sql
immutable
as $$
    select case role_name
        when 'owner' then 3
        when 'admin' then 2
        when 'member' then 1
        else 0
    end
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select auth.uid() is not null
       and exists (
           select 1
           from public.workspace_members wm
           where wm.workspace_id = target_workspace_id
             and wm.user_id = auth.uid()
       )
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, minimum_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select auth.uid() is not null
       and exists (
           select 1
           from public.workspace_members wm
           where wm.workspace_id = target_workspace_id
             and wm.user_id = auth.uid()
             and public.workspace_role_rank(wm.role) >= public.workspace_role_rank(minimum_role)
       )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    workspace_id uuid;
    workspace_name text;
begin
    workspace_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'Personal') || ' Workspace';

    insert into public.workspaces (name, slug, created_by)
    values (
        workspace_name,
        'personal-' || left(new.id::text, 8),
        new.id
    )
    returning id into workspace_id;

    insert into public.profile (id, active_workspace_id)
    values (new.id, workspace_id)
    on conflict (id) do update
        set active_workspace_id = coalesce(public.profile.active_workspace_id, excluded.active_workspace_id);

    insert into public.workspace_members (workspace_id, user_id, user_email, role)
    values (workspace_id, new.id, new.email, 'owner')
    on conflict (workspace_id, user_id) do nothing;

    insert into public.workspace_sms_gateway (workspace_id)
    values (workspace_id)
    on conflict (workspace_id) do nothing;

    return new;
end;
$$;

drop policy if exists "Authenticated users can read segments" on segments;
drop policy if exists "Authenticated users can read templates" on templates;
drop policy if exists "Authenticated users can read contacts" on contacts;
drop policy if exists "Authenticated users can read campaigns" on campaigns;
drop policy if exists "messages owner read" on messages;
drop policy if exists "messages owner insert" on messages;
drop policy if exists "messages owner update" on messages;
drop policy if exists "messages owner delete" on messages;
drop policy if exists "processed_webhook_events owner read" on processed_webhook_events;
drop policy if exists "Users can update their profile" on profile;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_invitations enable row level security;
alter table workspace_sms_gateway enable row level security;

create policy "workspaces member read" on workspaces
    for select to authenticated using (public.is_workspace_member(id));

create policy "workspace_members member read" on workspace_members
    for select to authenticated using (public.is_workspace_member(workspace_id));

create policy "workspace_invitations admin read" on workspace_invitations
    for select to authenticated using (public.has_workspace_role(workspace_id, 'admin'));

create policy "workspace_sms_gateway admin read" on workspace_sms_gateway
    for select to authenticated using (public.has_workspace_role(workspace_id, 'admin'));

create policy "Users can update their profile" on profile
    for update to authenticated
    using (auth.uid() = id)
    with check (
        auth.uid() = id
        and (
            active_workspace_id is null
            or public.is_workspace_member(active_workspace_id)
        )
    );

create policy "segments workspace read" on segments
    for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "segments admin write" on segments
    for all to authenticated
    using (public.has_workspace_role(workspace_id, 'admin'))
    with check (public.has_workspace_role(workspace_id, 'admin'));

create policy "templates workspace read" on templates
    for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "templates admin write" on templates
    for all to authenticated
    using (public.has_workspace_role(workspace_id, 'admin'))
    with check (public.has_workspace_role(workspace_id, 'admin'));

create policy "contacts workspace read" on contacts
    for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "contacts admin write" on contacts
    for all to authenticated
    using (public.has_workspace_role(workspace_id, 'admin'))
    with check (public.has_workspace_role(workspace_id, 'admin'));

create policy "campaigns workspace read" on campaigns
    for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "campaigns member write" on campaigns
    for all to authenticated
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy "messages workspace read" on messages
    for select to authenticated using (public.is_workspace_member(workspace_id));

create policy "processed_webhook_events workspace read" on processed_webhook_events
    for select to authenticated using (public.is_workspace_member(workspace_id));

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
    active_workspace uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    select p.active_workspace_id
    into active_workspace
    from public.profile p
    where p.id = auth.uid();

    if active_workspace is null or not public.has_workspace_role(active_workspace, 'admin') then
        raise exception 'You do not have permission to manage audience data in this workspace.';
    end if;

    if length(trim(coalesce(segment_name, ''))) < 2 then
        raise exception 'Segment name must be at least 2 characters long.';
    end if;

    if coalesce(segment_color_hex, '') !~ '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$' then
        raise exception 'Invalid hex color code.';
    end if;

    insert into public.segments (workspace_id, name, description, color_hex)
    values (
        active_workspace,
        trim(segment_name),
        nullif(trim(coalesce(segment_description, '')), ''),
        segment_color_hex
    )
    returning id into new_segment_id;

    return new_segment_id;
end;
$$;

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
    active_workspace uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    select p.active_workspace_id
    into active_workspace
    from public.profile p
    where p.id = auth.uid();

    if active_workspace is null or not public.has_workspace_role(active_workspace, 'admin') then
        raise exception 'You do not have permission to manage audience data in this workspace.';
    end if;

    if length(trim(coalesce(contact_name, ''))) < 2 then
        raise exception 'Name must be at least 2 characters long.';
    end if;

    if coalesce(contact_phone_no, '') !~ '^\d{7,}$' then
        raise exception 'Phone number must contain at least 7 digits.';
    end if;

    if not exists (
        select 1
        from public.segments
        where id = contact_segment_id
          and workspace_id = active_workspace
    ) then
        raise exception 'Selected segment does not exist in this workspace.';
    end if;

    insert into public.contacts (workspace_id, full_name, phone_no, status, segment_id)
    values (
        active_workspace,
        trim(contact_name),
        contact_phone_no::bigint,
        'active',
        contact_segment_id
    )
    returning id into new_contact_id;

    return new_contact_id;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;

grant select on table
    public.profile,
    public.workspaces,
    public.workspace_members,
    public.workspace_invitations,
    public.workspace_sms_gateway,
    public.segments,
    public.templates,
    public.contacts,
    public.campaigns,
    public.messages,
    public.processed_webhook_events
to authenticated;

grant update (active_workspace_id) on table public.profile to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant execute on function public.create_segment_for_authenticated(text, text, text) to authenticated;
grant execute on function public.create_contact_for_authenticated(text, text, uuid) to authenticated;

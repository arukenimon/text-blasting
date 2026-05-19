-- ────────────────────────────────────────────────────────────────────────────
-- Messages, webhook event dedupe, and profile/campaigns extensions
-- ────────────────────────────────────────────────────────────────────────────
-- This migration introduces real message tracking and per-user webhook routing
-- for the Android SMS Gateway integration. See plan: refactor for real sync.

-- pgcrypto for gen_random_uuid / gen_random_bytes (no-op if already enabled)
create extension if not exists pgcrypto;

-- ── set_updated_at() — declared here too so this migration is self-contained
-- (the earlier 20260309000000_create_settings.sql defines this, but it may
-- never have been applied if the settings table was created via the dashboard).
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ── Guard against half-built versions of these tables from earlier attempts ─
-- If `messages` or `processed_webhook_events` exist but are missing the
-- columns this migration needs, drop them so the create-if-not-exists below
-- builds the canonical shape. Safe because these tables are introduced by
-- THIS migration — nothing else should be writing to them yet.
-- Also drop the orphaned `message_status` enum left behind by a previous
-- prototype `messages` table.
do $$
begin
    if to_regclass('public.messages') is not null then
        if not exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'messages' and column_name = 'user_id'
        ) then
            execute 'drop table public.messages cascade';
        end if;
    end if;
    if to_regclass('public.processed_webhook_events') is not null then
        if not exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'processed_webhook_events' and column_name = 'user_id'
        ) then
            execute 'drop table public.processed_webhook_events cascade';
        end if;
    end if;
    if exists (select 1 from pg_type where typname = 'message_status') then
        execute 'drop type public.message_status cascade';
    end if;
end $$;

-- ── messages ────────────────────────────────────────────────────────────────
-- Note: campaigns.id is bigint in the existing schema; contacts.id is uuid.
create table if not exists messages (
    id                  uuid        primary key default gen_random_uuid(),
    user_id             uuid        not null references auth.users(id) on delete cascade,
    campaign_id         bigint               references campaigns(id) on delete set null,
    contact_id          uuid                 references contacts(id)  on delete set null,
    direction           text        not null check (direction in ('outbound','inbound')),
    phone_no            text        not null,
    body                text        not null default '',
    gateway_message_id  text,
    status              text        not null check (status in
                            ('pending','queued','sent','delivered','failed','received')),
    sent_at             timestamptz,
    delivered_at        timestamptz,
    failed_at           timestamptz,
    received_at         timestamptz,
    error_reason        text,
    sim_slot            int,
    parts_count         int,
    media_url           text[],
    subject             text,
    metadata            jsonb       not null default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists messages_user_campaign_idx
    on messages (user_id, campaign_id);
create index if not exists messages_user_gateway_id_idx
    on messages (user_id, gateway_message_id);
create index if not exists messages_user_direction_created_idx
    on messages (user_id, direction, created_at desc);

-- Partial unique: only outbound (and any inbound that does carry an id) dedupe
create unique index if not exists messages_user_gateway_id_unique
    on messages (user_id, gateway_message_id)
    where gateway_message_id is not null;

-- Reuse the trigger function from the settings migration
drop trigger if exists messages_updated_at on messages;
create trigger messages_updated_at
    before update on messages
    for each row execute procedure set_updated_at();

-- ── processed_webhook_events (lightweight idempotency) ──────────────────────
create table if not exists processed_webhook_events (
    user_id           uuid        not null references auth.users(id) on delete cascade,
    gateway_event_id  text        not null,
    received_at       timestamptz not null default now(),
    primary key (user_id, gateway_event_id)
);

-- ── profile extensions ──────────────────────────────────────────────────────
alter table profile
    add column if not exists mode             text not null default 'cloud'
        check (mode in ('local','cloud')),
    add column if not exists webhook_token    uuid not null default gen_random_uuid(),
    add column if not exists webhook_secret   text not null default encode(gen_random_bytes(32),'hex'),
    add column if not exists webhook_registrations jsonb not null default '{}'::jsonb;

create unique index if not exists profile_webhook_token_idx
    on profile (webhook_token);

-- ── campaigns extensions ────────────────────────────────────────────────────
alter table campaigns
    add column if not exists status        text not null default 'Draft'
        check (status in ('Draft','Scheduled','Running','Completed','Paused','Failed')),
    add column if not exists started_at    timestamptz,
    add column if not exists completed_at  timestamptz,
    add column if not exists user_id       uuid references auth.users(id) on delete set null;

create index if not exists campaigns_status_scheduled_idx
    on campaigns (status, scheduled_date);

-- ── RLS: messages ───────────────────────────────────────────────────────────
alter table messages enable row level security;

drop policy if exists "messages owner read" on messages;
create policy "messages owner read" on messages
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "messages owner insert" on messages;
create policy "messages owner insert" on messages
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "messages owner update" on messages;
create policy "messages owner update" on messages
    for update to authenticated
    using (auth.uid() = user_id);

drop policy if exists "messages owner delete" on messages;
create policy "messages owner delete" on messages
    for delete to authenticated
    using (auth.uid() = user_id);

-- ── RLS: processed_webhook_events (service-role only in practice) ───────────
alter table processed_webhook_events enable row level security;

drop policy if exists "processed_webhook_events owner read" on processed_webhook_events;
create policy "processed_webhook_events owner read" on processed_webhook_events
    for select to authenticated
    using (auth.uid() = user_id);

-- ── Realtime publication ────────────────────────────────────────────────────
-- Add messages to the realtime publication so clients can subscribe
do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime' and tablename = 'messages'
        ) then
            alter publication supabase_realtime add table messages;
        end if;
    end if;
end $$;

create table if not exists settings (
    key text primary key,
    value jsonb not null default '{}',
    updated_at timestamptz not null default now()
);

-- Automatically bump updated_at on every update
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger settings_updated_at
    before update on settings
    for each row execute procedure set_updated_at();

-- Seed default rows so upsert always has something to update
insert into
    settings (key, value)
values (
        'profile',
        '{"display_name": ""}'
    ),
    (
        'notifications',
        '{"campaign_completed": true, "new_reply": true, "optout_threshold": false, "delivery_errors": true}'
    ),
    (
        'sms_gateway',
        '{"local_address": "", "public_address": "", "local_username": "", "local_password": "", "cloud_address": "api.sms-gate.app:443", "cloud_username": "", "cloud_password": ""}'
    ) on conflict (key) do nothing;

-- RLS: only authenticated users can read/write
alter table settings enable row level security;

create policy "Authenticated users can read settings" on settings for
select to authenticated using (true);

create policy "Authenticated users can upsert settings" on settings for
insert
    to authenticated
with
    check (true);

create policy "Authenticated users can update settings" on settings for
update to authenticated using (true);
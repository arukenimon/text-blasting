-- Keep the cron scheduler query cheap as campaign history grows.
create index if not exists campaigns_due_scheduled_idx
    on public.campaigns (scheduled_date, id)
    where status = 'Scheduled';

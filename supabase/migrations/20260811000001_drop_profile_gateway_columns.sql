-- Webhook routing is workspace-owned after
-- 20260811000000_workspace_multitenancy.sql.

drop index if exists profile_webhook_token_idx;

alter table profile
    drop column if exists webhook_token,
    drop column if exists webhook_secret,
    drop column if exists webhook_registrations;

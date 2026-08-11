-- SMS gateway configuration is now workspace-owned in workspace_sms_gateway.
-- Profile should only keep user/session preferences.

alter table profile
    drop column if exists mode,
    drop column if exists local_server,
    drop column if exists cloud_server,
    drop column if exists sim_slot;

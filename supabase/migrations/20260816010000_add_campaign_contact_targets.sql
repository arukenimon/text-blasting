alter table campaigns
    add column if not exists contact_ids uuid[];

create index if not exists campaigns_contact_ids_idx
    on campaigns using gin (contact_ids);

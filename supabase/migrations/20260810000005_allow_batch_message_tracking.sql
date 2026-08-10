-- A campaign can send one gateway request to multiple recipients. Some
-- gateway responses/events share the same message id across that batch, so
-- uniqueness must not be limited to (user_id, gateway_message_id).

drop index if exists messages_user_gateway_id_unique;

create index if not exists messages_user_gateway_recipient_idx
    on messages (user_id, gateway_message_id, phone_no)
    where gateway_message_id is not null;

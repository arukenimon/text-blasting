-- Accepted invitations belong to the user who accepted them. Remove that
-- invitation record when the auth user is deleted, matching workspace_members.

alter table public.workspace_invitations
    drop constraint if exists workspace_invitations_accepted_by_fkey;

alter table public.workspace_invitations
    add constraint workspace_invitations_accepted_by_fkey
    foreign key (accepted_by)
    references auth.users(id)
    on delete cascade;

-- Clean up accepted invitations orphaned by the previous ON DELETE SET NULL FK.
delete from public.workspace_invitations
where status = 'accepted'
  and accepted_by is null;

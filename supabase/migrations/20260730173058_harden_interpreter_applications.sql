-- Candidaturas são criadas exclusivamente pela Server Action com service role.
-- A Task 6 continuará revisando candidaturas como admin autenticado, sujeita à
-- policy admin-only abaixo e ao trigger de integridade.

drop policy if exists certificates_insert_own
  on storage.objects;
drop policy if exists certificates_update_own
  on storage.objects;
drop policy if exists certificates_delete_own_or_admin
  on storage.objects;

drop policy if exists interpreter_applications_insert_own
  on public.interpreter_applications;

drop policy if exists interpreter_applications_update
  on public.interpreter_applications;
create policy interpreter_applications_update
  on public.interpreter_applications
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create or replace function private.guard_interpreter_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.profile_id is distinct from old.profile_id
       or new.created_at is distinct from old.created_at then
      raise exception 'application identity fields are immutable';
    end if;

    if not private.is_admin()
       and new.certificate_path is distinct from old.certificate_path then
      raise exception 'only admins can change application certificates';
    end if;

    if not private.is_admin()
       and (
         new.status is distinct from old.status
         or new.rejection_reason is distinct from old.rejection_reason
         or new.reviewed_by is distinct from old.reviewed_by
         or new.reviewed_at is distinct from old.reviewed_at
       ) then
      raise exception 'only admins can review applications';
    end if;
  end if;

  return new;
end;
$$;

create unique index interpreter_applications_one_active_per_profile_idx
  on public.interpreter_applications (profile_id)
  where status in ('pending', 'approved');

revoke insert on table public.interpreter_applications from authenticated;
grant select, update on table public.interpreter_applications to authenticated;

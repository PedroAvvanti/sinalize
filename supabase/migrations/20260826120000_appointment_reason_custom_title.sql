-- Custom title when reason_code = 'outro'; details stay in reason_text (optional).

alter table public.appointments
  add column reason_custom_title text;

alter table public.appointments
  add constraint appointments_reason_custom_title_check
  check (
    (
      reason_code = 'outro'
      and reason_custom_title is not null
      and length(btrim(reason_custom_title)) > 0
      and char_length(reason_custom_title) <= 120
    )
    or (
      reason_code <> 'outro'
      and reason_custom_title is null
    )
  );

create or replace function private.guard_appointment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.requester_id is distinct from old.requester_id
     or new.scheduled_at is distinct from old.scheduled_at
     or new.duration_minutes is distinct from old.duration_minutes
     or new.reason_code is distinct from old.reason_code
     or new.reason_text is distinct from old.reason_text
     or new.reason_custom_title is distinct from old.reason_custom_title
     or new.jitsi_room_name is distinct from old.jitsi_room_name
     or new.created_at is distinct from old.created_at then
    raise exception 'appointment request fields are immutable';
  end if;

  if new.status = old.status
     and new.interpreter_id is not distinct from old.interpreter_id then
    return new;
  end if;

  if not (
    (old.status = 'open' and new.status in ('accepted', 'cancelled', 'expired'))
    or (old.status = 'accepted' and new.status in ('cancel_requested', 'cancelled', 'completed'))
    or (
      old.status = 'cancel_requested'
      and new.status in ('open', 'accepted', 'cancelled')
    )
  ) then
    raise exception 'invalid appointment status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'open' and new.interpreter_id is not null then
    raise exception 'open appointments cannot have an interpreter';
  end if;

  if old.status = 'cancel_requested'
     and new.status = 'open'
     and new.interpreter_id is not null then
    raise exception 'reopened appointments must clear the interpreter';
  end if;

  if new.interpreter_id is distinct from old.interpreter_id
     and not (
       (old.status = 'open' and new.status = 'accepted')
       or (old.status = 'cancel_requested' and new.status = 'open')
     ) then
    raise exception 'interpreter can only change on acceptance or reopening';
  end if;

  return new;
end;
$$;

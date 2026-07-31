create or replace function private.request_or_cancel_appointment(
  p_appointment_id uuid,
  p_reason_code public.cancellation_reason_code,
  p_reason_text text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_row public.appointments;
  v_scheduled_date date;
  v_now_date date;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select private.current_role() into v_role;

  if v_role not in ('user', 'interpreter') then
    raise exception 'only participants can cancel';
  end if;

  select *
  into v_row
  from public.appointments
  where id = p_appointment_id
  for update;

  if v_row.id is null then
    raise exception 'appointment not found';
  end if;

  if v_row.requester_id <> v_uid
     and coalesce(v_row.interpreter_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_uid then
    raise exception 'not a participant';
  end if;

  if v_row.status not in ('open', 'accepted') then
    raise exception 'appointment cannot be cancelled';
  end if;

  if exists (
    select 1
    from public.cancellation_requests cr
    where cr.appointment_id = p_appointment_id
      and cr.status = 'pending'
  ) then
    raise exception 'cancellation already pending';
  end if;

  v_scheduled_date := (timezone('America/Sao_Paulo', v_row.scheduled_at))::date;
  v_now_date := (timezone('America/Sao_Paulo', now()))::date;

  if v_role = 'user'
     and v_row.requester_id = v_uid
     and v_now_date < v_scheduled_date then
    update public.appointments
    set status = 'cancelled',
        updated_at = now()
    where id = p_appointment_id
    returning * into v_row;

    return v_row;
  end if;

  if v_role = 'interpreter' and v_row.interpreter_id is distinct from v_uid then
    raise exception 'not assigned interpreter';
  end if;

  insert into public.cancellation_requests (
    appointment_id,
    reason_code,
    reason_text
  )
  values (
    p_appointment_id,
    p_reason_code,
    nullif(btrim(coalesce(p_reason_text, '')), '')
  );

  update public.appointments
  set status = 'cancel_requested',
      updated_at = now()
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.request_or_cancel_appointment(
  p_appointment_id uuid,
  p_reason_code public.cancellation_reason_code,
  p_reason_text text default null
)
returns public.appointments
language sql
security invoker
set search_path = ''
as $$
  select private.request_or_cancel_appointment(
    p_appointment_id,
    p_reason_code,
    p_reason_text
  );
$$;

revoke all on function public.request_or_cancel_appointment(uuid, public.cancellation_reason_code, text)
  from public, anon;
grant execute on function public.request_or_cancel_appointment(uuid, public.cancellation_reason_code, text)
  to authenticated, service_role;
grant execute on function private.request_or_cancel_appointment(uuid, public.cancellation_reason_code, text)
  to authenticated, service_role;

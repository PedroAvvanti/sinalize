create or replace function private.decide_cancellation_request(
  p_request_id uuid,
  p_decision public.cancellation_status,
  p_admin_decision_note text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.cancellation_requests;
  v_row public.appointments;
begin
  if not private.is_admin() then
    raise exception 'only admins can decide cancellation requests';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid cancellation decision';
  end if;

  select *
  into v_request
  from public.cancellation_requests
  where id = p_request_id
    and status = 'pending'
  for update;

  if v_request.id is null then
    raise exception 'cancellation request not pending';
  end if;

  select *
  into v_row
  from public.appointments
  where id = v_request.appointment_id
    and status = 'cancel_requested'
  for update;

  if v_row.id is null then
    raise exception 'appointment not awaiting cancellation decision';
  end if;

  update public.cancellation_requests
  set status = p_decision,
      admin_decision_note = nullif(btrim(coalesce(p_admin_decision_note, '')), '')
  where id = p_request_id;

  if p_decision = 'rejected' then
    update public.appointments
    set status = 'accepted',
        updated_at = now()
    where id = v_row.id
    returning * into v_row;
  elsif v_request.requested_by_role = 'interpreter' then
    update public.appointments
    set status = 'open',
        interpreter_id = null,
        updated_at = now()
    where id = v_row.id
    returning * into v_row;
  else
    update public.appointments
    set status = 'cancelled',
        updated_at = now()
    where id = v_row.id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.decide_cancellation_request(
  p_request_id uuid,
  p_decision public.cancellation_status,
  p_admin_decision_note text default null
)
returns public.appointments
language sql
security invoker
set search_path = ''
as $$
  select private.decide_cancellation_request(
    p_request_id,
    p_decision,
    p_admin_decision_note
  );
$$;

revoke all on function public.decide_cancellation_request(uuid, public.cancellation_status, text)
  from public, anon;
grant execute on function public.decide_cancellation_request(uuid, public.cancellation_status, text)
  to authenticated, service_role;
grant execute on function private.decide_cancellation_request(uuid, public.cancellation_status, text)
  to authenticated, service_role;

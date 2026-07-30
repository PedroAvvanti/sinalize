-- Sinalize MVP: schema inicial, RLS, RPCs privilegiadas e storage

create extension if not exists "pgcrypto";

create schema if not exists private;

revoke all on schema private from public;
-- USAGE para authenticated: necessário para chamar helpers/RPC privados nas policies e wrappers.
grant usage on schema private to postgres, service_role, authenticated;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.profile_role as enum ('user', 'interpreter', 'admin');
create type public.theme_preference as enum ('light', 'dark');

create type public.application_status as enum ('pending', 'approved', 'rejected');

create type public.appointment_status as enum (
  'open',
  'accepted',
  'cancel_requested',
  'cancelled',
  'completed',
  'expired'
);

create type public.cancellation_status as enum ('pending', 'approved', 'rejected');

create type public.cancellation_requester_role as enum ('user', 'interpreter');

create type public.appointment_reason_code as enum (
  'saude',
  'educacao',
  'trabalho',
  'servicos_publicos',
  'comercio',
  'outro'
);

create type public.cancellation_reason_code as enum (
  'imprevisto',
  'doenca',
  'conflito_horario',
  'problema_tecnico',
  'outro'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.profile_role not null default 'user',
  full_name text not null default '',
  theme_preference public.theme_preference not null default 'light',
  average_rating numeric(3, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_average_rating_range
    check (average_rating is null or (average_rating >= 1 and average_rating <= 5))
);

create table public.interpreter_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'pending',
  certificate_path text not null,
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interpreter_applications_review_state_check
    check (
      (
        status = 'pending'
        and rejection_reason is null
        and reviewed_by is null
        and reviewed_at is null
      )
      or (
        status = 'approved'
        and rejection_reason is null
        and reviewed_by is not null
        and reviewed_at is not null
      )
      or (
        status = 'rejected'
        and nullif(btrim(rejection_reason), '') is not null
        and reviewed_by is not null
        and reviewed_at is not null
      )
    )
);

create index interpreter_applications_profile_id_idx
  on public.interpreter_applications (profile_id);

create index interpreter_applications_status_idx
  on public.interpreter_applications (status);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  interpreter_id uuid references public.profiles (id),
  status public.appointment_status not null default 'open',
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  reason_code public.appointment_reason_code not null,
  reason_text text,
  jitsi_room_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_duration_minutes_check
    check (duration_minutes in (15, 30, 60)),
  constraint appointments_room_name_not_blank
    check (nullif(btrim(jitsi_room_name), '') is not null),
  constraint appointments_interpreter_state_check
    check (
      (status in ('open', 'expired') and interpreter_id is null)
      or (status in ('accepted', 'cancel_requested', 'completed') and interpreter_id is not null)
      or status = 'cancelled'
    )
);

create index appointments_status_idx on public.appointments (status);
create index appointments_requester_id_idx on public.appointments (requester_id);
create index appointments_interpreter_id_idx on public.appointments (interpreter_id);
create index appointments_scheduled_at_idx on public.appointments (scheduled_at);

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  requested_by_role public.cancellation_requester_role not null,
  reason_code public.cancellation_reason_code not null,
  reason_text text,
  status public.cancellation_status not null default 'pending',
  admin_decision_note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cancellation_requests_review_state_check
    check (
      (
        status = 'pending'
        and admin_decision_note is null
        and reviewed_by is null
        and reviewed_at is null
      )
      or (
        status in ('approved', 'rejected')
        and reviewed_by is not null
        and reviewed_at is not null
      )
    )
);

create index cancellation_requests_appointment_id_idx
  on public.cancellation_requests (appointment_id);
create index cancellation_requests_status_idx
  on public.cancellation_requests (status);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_one_per_author unique (appointment_id, from_profile_id),
  constraint reviews_not_self check (from_profile_id <> to_profile_id)
);

create index reviews_to_profile_id_idx on public.reviews (to_profile_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  related_appointment_id uuid references public.appointments (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_profile_id_idx on public.notifications (profile_id);
create index notifications_profile_unread_idx
  on public.notifications (profile_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- Helpers (private security definer)
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role::text
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_role() = 'admin', false);
$$;

create or replace function private.is_approved_interpreter()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.interpreter_applications ia
    where ia.profile_id = auth.uid()
      and ia.status = 'approved'
  );
$$;

create or replace function private.list_public_profiles()
returns table (
  id uuid,
  full_name text,
  role public.profile_role,
  average_rating numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.role, p.average_rating
  from public.profiles p;
$$;

create or replace function private.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if coalesce(private.current_role() = 'admin', false) then
    return new;
  end if;

  new.role := old.role;
  new.average_rating := old.average_rating;
  return new;
end;
$$;

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

create or replace function private.prepare_cancellation_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if tg_op = 'INSERT' then
    v_role := private.current_role();

    if auth.uid() is null
       or coalesce(v_role not in ('user', 'interpreter'), true) then
      raise exception 'only participants can request cancellation';
    end if;

    new.requested_by := auth.uid();
    new.requested_by_role := v_role::public.cancellation_requester_role;
    new.status := 'pending';
    new.admin_decision_note := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.appointment_id is distinct from old.appointment_id
     or new.requested_by is distinct from old.requested_by
     or new.requested_by_role is distinct from old.requested_by_role
     or new.reason_code is distinct from old.reason_code
     or new.reason_text is distinct from old.reason_text
     or new.created_at is distinct from old.created_at then
    raise exception 'cancellation request fields are immutable';
  end if;

  if not private.is_admin() then
    raise exception 'only admins can decide cancellation requests';
  end if;

  if new.status = 'pending' then
    new.admin_decision_note := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;

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

create or replace function private.refresh_average_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
  set average_rating = (
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.to_profile_id = new.to_profile_id
      ),
      updated_at = now()
  where p.id = new.to_profile_id;

  return new;
end;
$$;

create or replace function private.accept_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.interpreter_applications ia
    where ia.profile_id = v_uid
      and ia.status = 'approved'
  ) then
    raise exception 'interpreter not approved';
  end if;

  update public.appointments a
  set status = 'accepted',
      interpreter_id = v_uid,
      updated_at = now()
  where a.id = p_appointment_id
    and a.status = 'open'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'already accepted';
  end if;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public wrappers (security invoker) + signup trigger
-- ---------------------------------------------------------------------------

create or replace function public.accept_appointment(p_appointment_id uuid)
returns public.appointments
language sql
security invoker
set search_path = ''
as $$
  select private.accept_appointment(p_appointment_id);
$$;

create or replace function public.list_public_profiles()
returns table (
  id uuid,
  full_name text,
  role public.profile_role,
  average_rating numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_public_profiles();
$$;

create or replace view public.public_profiles
with (security_invoker = true)
as
  select id, full_name, role, average_rating
  from public.list_public_profiles();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, theme_preference)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'role' = 'interpreter' then 'interpreter'::public.profile_role
      else 'user'::public.profile_role
    end,
    'light'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function private.protect_profile_fields();

create trigger interpreter_applications_set_updated_at
  before update on public.interpreter_applications
  for each row execute function private.set_updated_at();

create trigger interpreter_applications_guard
  before insert or update on public.interpreter_applications
  for each row execute function private.guard_interpreter_application();

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function private.set_updated_at();

create trigger appointments_guard_update
  before update on public.appointments
  for each row execute function private.guard_appointment_update();

create trigger cancellation_requests_set_updated_at
  before update on public.cancellation_requests
  for each row execute function private.set_updated_at();

create trigger cancellation_requests_prepare
  before insert or update on public.cancellation_requests
  for each row execute function private.prepare_cancellation_request();

create trigger reviews_refresh_average_rating
  after insert on public.reviews
  for each row execute function private.refresh_average_rating();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.interpreter_applications enable row level security;
alter table public.appointments enable row level security;
alter table public.cancellation_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- profiles: tabela base somente para dono/admin; projeção pública pela view
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or private.is_admin());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or private.is_admin())
  with check (id = auth.uid() or private.is_admin());

-- interpreter_applications
create policy interpreter_applications_select
  on public.interpreter_applications
  for select
  to authenticated
  using (profile_id = auth.uid() or private.is_admin());

create policy interpreter_applications_insert_own
  on public.interpreter_applications
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and private.current_role() = 'interpreter'
    and status = 'pending'
    and rejection_reason is null
    and reviewed_by is null
    and reviewed_at is null
  );

create policy interpreter_applications_update
  on public.interpreter_applications
  for update
  to authenticated
  using (profile_id = auth.uid() or private.is_admin())
  with check (profile_id = auth.uid() or private.is_admin());

-- appointments
create policy appointments_select
  on public.appointments
  for select
  to authenticated
  using (
    private.is_admin()
    or requester_id = auth.uid()
    or interpreter_id = auth.uid()
    or (status = 'open' and private.is_approved_interpreter())
  );

create policy appointments_insert_requester
  on public.appointments
  for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and private.current_role() = 'user'
    and status = 'open'
    and interpreter_id is null
  );

create policy appointments_update_admin
  on public.appointments
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- cancellation_requests
create policy cancellation_requests_select
  on public.cancellation_requests
  for select
  to authenticated
  using (
    private.is_admin()
    or requested_by = auth.uid()
    or exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and (a.requester_id = auth.uid() or a.interpreter_id = auth.uid())
    )
  );

create policy cancellation_requests_insert
  on public.cancellation_requests
  for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and requested_by_role = private.current_role()::public.cancellation_requester_role
    and status = 'pending'
    and admin_decision_note is null
    and reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and (a.requester_id = auth.uid() or a.interpreter_id = auth.uid())
    )
  );

create policy cancellation_requests_update_admin
  on public.cancellation_requests
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- reviews: linha inteira privada (autor, avaliado ou admin)
create policy reviews_select_private
  on public.reviews
  for select
  to authenticated
  using (
    private.is_admin()
    or from_profile_id = auth.uid()
    or to_profile_id = auth.uid()
  );

create policy reviews_insert_own
  on public.reviews
  for insert
  to authenticated
  with check (
    from_profile_id = auth.uid()
    and exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and a.status = 'completed'
        and (a.requester_id = auth.uid() or a.interpreter_id = auth.uid())
        and (
          (a.requester_id = auth.uid() and a.interpreter_id = to_profile_id)
          or (a.interpreter_id = auth.uid() and a.requester_id = to_profile_id)
        )
    )
  );

-- notifications
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (profile_id = auth.uid() or private.is_admin());

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy notifications_insert_admin_or_self
  on public.notifications
  for insert
  to authenticated
  with check (profile_id = auth.uid() or private.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket certificates (privado)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy certificates_select_own_or_admin
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy certificates_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and private.current_role() = 'interpreter'
  );

create policy certificates_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'certificates'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'certificates'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy certificates_delete_own_or_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'certificates'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select, update on table public.profiles to authenticated;
grant select on table public.public_profiles to authenticated;
grant select, insert, update on table public.interpreter_applications to authenticated;
grant select, insert, update on table public.appointments to authenticated;
grant select, insert, update on table public.cancellation_requests to authenticated;
grant select, insert on table public.reviews to authenticated;
grant select, insert, update on table public.notifications to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

grant execute on function private.current_role() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_approved_interpreter() to authenticated, service_role;
grant execute on function private.list_public_profiles() to authenticated, service_role;
grant execute on function private.accept_appointment(uuid) to authenticated, service_role;
revoke all on function public.accept_appointment(uuid) from public, anon;
grant execute on function public.accept_appointment(uuid) to authenticated, service_role;
revoke all on function public.list_public_profiles() from public, anon;
grant execute on function public.list_public_profiles() to authenticated, service_role;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

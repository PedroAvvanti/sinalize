-- Allow any positive integer duration (minutes), not only 15/30/60.
alter table public.appointments
  drop constraint if exists appointments_duration_minutes_check;

alter table public.appointments
  add constraint appointments_duration_minutes_check
  check (duration_minutes >= 1);

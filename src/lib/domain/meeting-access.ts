export const MEETING_EARLY_ACCESS_MINUTES = 10;

export function isWithinMeetingWindow(
  scheduledAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): boolean {
  const windowStart =
    scheduledAt.getTime() - MEETING_EARLY_ACCESS_MINUTES * 60 * 1000;
  const windowEnd = scheduledAt.getTime() + durationMinutes * 60 * 1000;
  const current = now.getTime();

  return current >= windowStart && current <= windowEnd;
}

export function appointmentEndsAt(
  scheduledAt: Date,
  durationMinutes: number,
): Date {
  return new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
}

export function isUpcomingAppointment(
  scheduledAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): boolean {
  return appointmentEndsAt(scheduledAt, durationMinutes).getTime() > now.getTime();
}

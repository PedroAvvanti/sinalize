export const APPOINTMENT_DURATIONS = [15, 30, 60] as const;

export type AppointmentDuration = (typeof APPOINTMENT_DURATIONS)[number];

const CANONICAL_ISO_DATETIME =
  /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

export function isValidDuration(value: number): value is AppointmentDuration {
  return APPOINTMENT_DURATIONS.some((duration) => duration === value);
}

export function parseScheduledAtIso(value: string): Date | null {
  const match = CANONICAL_ISO_DATETIME.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildJitsiRoomName(appointmentId: string): string {
  return `sinalize-${appointmentId}`;
}

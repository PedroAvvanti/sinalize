export const APPOINTMENT_DURATIONS = [15, 30, 60] as const;

export type AppointmentDuration = (typeof APPOINTMENT_DURATIONS)[number];

export function isValidDuration(value: number): value is AppointmentDuration {
  return APPOINTMENT_DURATIONS.some((duration) => duration === value);
}

export function buildJitsiRoomName(appointmentId: string): string {
  return `sinalize-${appointmentId}`;
}

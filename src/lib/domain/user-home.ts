import { isUpcomingAppointment } from "./meeting-access";

export type NextCallCandidate = {
  id: string;
  status: "open" | "accepted" | "cancel_requested";
  scheduled_at: string;
  duration_minutes: number;
  reason_code: string;
  reason_custom_title: string | null;
  reason_text: string | null;
};

export function pickNextCall(
  appointments: NextCallCandidate[],
  now: Date,
): NextCallCandidate | null {
  const upcoming = appointments.filter((appointment) =>
    isUpcomingAppointment(
      new Date(appointment.scheduled_at),
      appointment.duration_minutes,
      now,
    ),
  );

  if (upcoming.length === 0) {
    return null;
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  );

  const confirmed = upcoming.find(
    (appointment) =>
      appointment.status === "accepted" ||
      appointment.status === "cancel_requested",
  );

  return confirmed ?? upcoming[0];
}

export function appointmentBecameAccepted(
  previous: Array<{ id: string; status: string }>,
  next: Array<{ id: string; status: string }>,
): boolean {
  const previousById = new Map(
    previous.map((appointment) => [appointment.id, appointment.status]),
  );

  return next.some((appointment) => {
    if (appointment.status !== "accepted") {
      return false;
    }

    return previousById.get(appointment.id) === "open";
  });
}

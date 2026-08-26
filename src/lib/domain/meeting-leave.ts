import type { AppointmentStatus } from "@/types/database";

export type LeaveMeetingIntent = {
  shouldComplete: boolean;
  redirectTo: string;
};

export type CompleteAppointmentEligibility =
  | "ok"
  | "already_done"
  | "blocked";

export function resolveLeaveMeetingIntent(
  role: "user" | "interpreter",
  appointmentId: string,
): LeaveMeetingIntent {
  if (role === "user") {
    return {
      shouldComplete: true,
      redirectTo: `/app/review/${appointmentId}`,
    };
  }

  return {
    shouldComplete: false,
    redirectTo: "/app/interpreter",
  };
}

export function canMarkAppointmentCompleted(
  status: AppointmentStatus,
): CompleteAppointmentEligibility {
  if (status === "completed") {
    return "already_done";
  }

  if (status === "accepted") {
    return "ok";
  }

  return "blocked";
}

export function resolveNotificationHref(
  type: string,
  relatedAppointmentId: string | null,
  role: "user" | "interpreter" | "admin",
): string | null {
  if (!relatedAppointmentId) {
    if (type === "interpreter_application_pending") {
      return "/app/admin/interpreters";
    }
    if (type === "cancellation_pending") {
      return "/app/admin/cancellations";
    }
    return null;
  }

  switch (type) {
    case "appointment_accepted":
    case "appointment_assigned":
      return `/app/meeting/${relatedAppointmentId}`;
    case "appointment_cancelled":
    case "cancellation_decided":
      return role === "admin"
        ? "/app/admin/cancellations"
        : `/app/user/history`;
    case "appointment_completed":
      return `/app/review/${relatedAppointmentId}`;
    default:
      if (role === "user") {
        return `/app/user`;
      }
      if (role === "interpreter") {
        return `/app/interpreter/agenda`;
      }
      return `/app/admin/appointments`;
  }
}

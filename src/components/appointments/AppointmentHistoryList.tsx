import Link from "next/link";

import { appointmentReasonDisplayLabel } from "@/lib/domain/reasons";
import type { Database } from "@/types/database";

export type HistoryAppointment = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  | "id"
  | "status"
  | "scheduled_at"
  | "duration_minutes"
  | "reason_code"
  | "reason_custom_title"
>;

type AppointmentHistoryListProps = {
  appointments: HistoryAppointment[];
  emptyTitle?: string;
  emptyDescription?: string;
  showReviewLink?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusLabels: Record<
  "cancelled" | "completed" | "expired",
  string
> = {
  cancelled: "Cancelado",
  completed: "Concluído",
  expired: "Expirado",
};

export function AppointmentHistoryList({
  appointments,
  emptyTitle = "Nenhum registro ainda",
  emptyDescription = "Atendimentos concluídos, cancelados ou expirados aparecerão aqui.",
  showReviewLink = false,
}: AppointmentHistoryListProps) {
  if (appointments.length === 0) {
    return (
      <div className="history-empty" role="status">
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="history-list">
      {appointments.map((appointment) => {
        const reason = appointmentReasonDisplayLabel(
          appointment.reason_code,
          appointment.reason_custom_title,
        );
        return (
          <li key={appointment.id} className="history-list__item">
            <div>
              <p className="history-list__reason">{reason}</p>
              <time dateTime={appointment.scheduled_at}>
                {dateFormatter.format(new Date(appointment.scheduled_at))}
              </time>
              <p className="history-list__duration">
                {appointment.duration_minutes} minutos
              </p>
            </div>
            <div className="history-list__aside">
              <span
                className={`request-status-badge request-status-badge-${appointment.status}`}
              >
                {statusLabels[appointment.status as keyof typeof statusLabels]}
              </span>
              {showReviewLink && appointment.status === "completed" ? (
                <Link
                  className="history-list__review-link"
                  href={`/app/review/${appointment.id}`}
                >
                  Avaliar
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

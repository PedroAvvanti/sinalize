import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";
import type { Database } from "@/types/database";

export type RequestStatusItem = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "status" | "scheduled_at" | "duration_minutes" | "reason_code"
>;

type RequestStatusListProps = {
  appointments: RequestStatusItem[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusLabels: Record<
  "open" | "accepted" | "cancel_requested" | "cancelled" | "completed" | "expired",
  string
> = {
  open: "Buscando intérprete",
  accepted: "Confirmado",
  cancel_requested: "Cancelamento em análise",
  cancelled: "Cancelado",
  completed: "Concluído",
  expired: "Expirado",
};

export function RequestStatusList({ appointments }: RequestStatusListProps) {
  if (appointments.length === 0) {
    return null;
  }

  return (
    <section className="request-status-list" aria-labelledby="request-status-title">
      <h2 id="request-status-title">Seus pedidos recentes</h2>
      <ul>
        {appointments.map((appointment) => {
          const reason =
            APPOINTMENT_REASONS.find(
              (option) => option.value === appointment.reason_code,
            )?.label ?? "Atendimento";

          return (
            <li key={appointment.id} className="request-status-item">
              <div>
                <p className="request-status-item__reason">{reason}</p>
                <time dateTime={appointment.scheduled_at}>
                  {dateFormatter.format(new Date(appointment.scheduled_at))}
                </time>
              </div>
              <span className={`request-status-badge request-status-badge-${appointment.status}`}>
                {statusLabels[appointment.status]}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

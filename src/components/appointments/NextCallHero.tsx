import Link from "next/link";

import { CancelDialog } from "@/components/appointments/CancelDialog";
import { isWithinMeetingWindow } from "@/lib/domain/meeting-access";
import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";

export type NextCallAppointment = {
  id: string;
  status: "open" | "accepted" | "cancel_requested";
  scheduled_at: string;
  duration_minutes: number;
  reason_code: string;
  reason_text: string | null;
};

type NextCallHeroProps = {
  appointment: NextCallAppointment | null;
  requesterName: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
});

const statusLabels: Record<NextCallAppointment["status"], string> = {
  open: "Buscando intérprete",
  accepted: "Confirmado",
  cancel_requested: "Cancelamento em análise",
};

export function NextCallHero({ appointment, requesterName }: NextCallHeroProps) {
  const greeting = requesterName.trim()
    ? `Olá, ${requesterName.trim()}`
    : "Olá";

  if (!appointment) {
    return (
      <section className="next-call-hero next-call-hero-empty" aria-labelledby="next-call-title">
        <p className="auth-eyebrow">Seu início</p>
        <h1 id="next-call-title">{greeting}</h1>
        <p className="next-call-lead">
          Quando você solicitar um atendimento, a próxima chamada aparecerá
          aqui em destaque.
        </p>
        <Link className="user-request-link" href="/app/user/request">
          Solicitar intérprete <span aria-hidden="true">→</span>
        </Link>
      </section>
    );
  }

  const scheduledAt = new Date(appointment.scheduled_at);
  const reason =
    APPOINTMENT_REASONS.find((option) => option.value === appointment.reason_code)
      ?.label ?? "Atendimento";
  const canEnter =
    (appointment.status === "accepted" ||
      appointment.status === "cancel_requested") &&
    isWithinMeetingWindow(scheduledAt, appointment.duration_minutes);

  return (
    <section className="next-call-hero" aria-labelledby="next-call-title">
      <div className="next-call-hero__header">
        <div>
          <p className="auth-eyebrow">Próxima chamada</p>
          <h1 id="next-call-title">{greeting}</h1>
        </div>
        <span className="next-call-status">{statusLabels[appointment.status]}</span>
      </div>

      <div className="next-call-card">
        <p className="next-call-reason">{reason}</p>
        <time dateTime={appointment.scheduled_at}>
          {dateFormatter.format(scheduledAt)}
        </time>
        <p className="next-call-duration">{appointment.duration_minutes} minutos</p>
        {appointment.reason_text ? (
          <p className="next-call-context">{appointment.reason_text}</p>
        ) : null}
      </div>

      <div className="next-call-actions">
        {canEnter ? (
          <Link
            className="user-request-link"
            href={`/app/meeting/${appointment.id}`}
          >
            Entrar na chamada <span aria-hidden="true">→</span>
          </Link>
        ) : appointment.status === "accepted" ||
          appointment.status === "cancel_requested" ? (
          <p className="next-call-hint" role="status">
            A sala abre 10 minutos antes do horário agendado.
          </p>
        ) : null}
        <Link className="next-call-secondary" href="/app/user/request">
          Solicitar intérprete
        </Link>
        {appointment.status === "open" ||
        appointment.status === "accepted" ? (
          <CancelDialog appointmentId={appointment.id} />
        ) : null}
      </div>
    </section>
  );
}

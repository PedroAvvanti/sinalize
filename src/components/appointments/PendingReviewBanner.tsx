import Link from "next/link";

import { appointmentReasonDisplayLabel } from "@/lib/domain/reasons";

export type PendingReview = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  reason_code: string;
  reason_custom_title: string | null;
  interpreter_name?: string | null;
};

type PendingReviewBannerProps = {
  appointment: PendingReview;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

export function PendingReviewBanner({ appointment }: PendingReviewBannerProps) {
  const scheduledAt = new Date(appointment.scheduled_at);
  const reason = appointmentReasonDisplayLabel(
    appointment.reason_code,
    appointment.reason_custom_title,
  );
  const interpreter = appointment.interpreter_name?.trim();

  return (
    <Link
      className="pending-review-banner pending-review-banner--link"
      href={`/app/review/${appointment.id}`}
      aria-labelledby="pending-review-title"
    >
      <div>
        <p className="auth-eyebrow">Pós-atendimento</p>
        <h2 id="pending-review-title">Avalie seu atendimento</h2>
        <p className="pending-review-banner__summary">
          <strong>{reason}</strong>
          {interpreter ? (
            <>
              {" "}
              com <strong>{interpreter}</strong>
            </>
          ) : null}
        </p>
        <p className="pending-review-banner__meta">
          <time dateTime={appointment.scheduled_at}>
            {dateFormatter.format(scheduledAt)}
          </time>
          {" · "}
          {appointment.duration_minutes} minutos
        </p>
        <p className="pending-review-banner__hint">
          Sua opinião ajuda a melhorar a experiência na plataforma.
        </p>
      </div>
      <span className="user-request-link pending-review-banner__cta">
        Avaliar agora <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";

import { acceptAppointmentAction } from "@/actions/appointments";
import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";
import type { OpenAppointment } from "@/components/appointments/OpenRequestsList";

type OpenRequestCardProps = {
  appointment: OpenAppointment;
  onAccepted: (appointmentId: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OpenRequestCard({
  appointment,
  onAccepted,
}: OpenRequestCardProps) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const acceptLockRef = useRef(false);
  const reason =
    APPOINTMENT_REASONS.find(
      (option) => option.value === appointment.reason_code,
    )?.label ?? "Outro";

  function acceptRequest() {
    if (isPending || acceptLockRef.current) {
      return;
    }

    acceptLockRef.current = true;
    setError(undefined);

    startTransition(async () => {
      try {
        const result = await acceptAppointmentAction(appointment.id);

        if (!result.ok) {
          setError(result.message);
          if (result.message === "Esse pedido já foi aceito por outra pessoa") {
            onAccepted(appointment.id);
          }
          return;
        }

        onAccepted(appointment.id);
      } finally {
        acceptLockRef.current = false;
      }
    });
  }

  return (
    <article className="open-request-card">
      <div className="open-request-card__header">
        <div>
          <p className="open-request-card__label">Atendimento solicitado</p>
          <h2>{reason}</h2>
        </div>
        <span>{appointment.duration_minutes} min</span>
      </div>

      <dl className="open-request-card__details">
        <div>
          <dt>Quando</dt>
          <dd>{dateFormatter.format(new Date(appointment.scheduled_at))}</dd>
        </div>
        {appointment.reason_text ? (
          <div>
            <dt>Contexto</dt>
            <dd>{appointment.reason_text}</dd>
          </div>
        ) : null}
      </dl>

      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="auth-submit"
        type="button"
        disabled={isPending}
        onClick={acceptRequest}
      >
        {isPending ? "Confirmando…" : "Aceitar atendimento"}
      </button>
    </article>
  );
}

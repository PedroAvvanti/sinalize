"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { decideCancellationAction } from "@/actions/cancellations";
import { APPOINTMENT_REASONS, CANCEL_REASONS } from "@/lib/domain/reasons";

type CancellationDecisionCardProps = {
  request: {
    id: string;
    requestedByRole: "user" | "interpreter";
    reasonCode: string;
    reasonText: string | null;
    submittedAt: string;
    scheduledAt: string;
    durationMinutes: number;
    appointmentReasonCode: string;
    urgent: boolean;
  };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const roleLabels = {
  user: "Usuário",
  interpreter: "Intérprete",
} as const;

export function CancellationDecisionCard({
  request,
}: CancellationDecisionCardProps) {
  const router = useRouter();
  const noteId = useId();
  const decisionLockRef = useRef(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [decided, setDecided] = useState(false);
  const [isPending, startTransition] = useTransition();

  const appointmentReason =
    APPOINTMENT_REASONS.find(
      (option) => option.value === request.appointmentReasonCode,
    )?.label ?? "Atendimento";
  const cancelReason =
    CANCEL_REASONS.find((option) => option.value === request.reasonCode)?.label ??
    "Motivo informado";

  function decide(decision: "approved" | "rejected") {
    if (isPending || decided || decisionLockRef.current) {
      return;
    }

    decisionLockRef.current = true;
    setMessage(null);
    setStatus(null);

    startTransition(async () => {
      const result = await decideCancellationAction({
        requestId: request.id,
        decision,
        note,
      });

      if (!result.ok) {
        decisionLockRef.current = false;
        setStatus("error");
        setMessage(result.error);
        return;
      }

      setDecided(true);
      setStatus("success");
      setMessage(result.message);
      router.refresh();
    });
  }

  const controlsDisabled = isPending || decided;

  return (
    <article
      className={
        request.urgent
          ? "cancellation-review-card cancellation-review-card-urgent"
          : "cancellation-review-card"
      }
    >
      <div className="cancellation-review-card__header">
        <div>
          <p className="review-card-label">
            {request.urgent ? "Urgente — atendimento hoje" : "Aguardando decisão"}
          </p>
          <h2>{appointmentReason}</h2>
        </div>
        <span className="cancellation-role-badge">
          {roleLabels[request.requestedByRole]}
        </span>
      </div>

      <dl className="cancellation-review-card__details">
        <div>
          <dt>Quando</dt>
          <dd>{dateFormatter.format(new Date(request.scheduledAt))}</dd>
        </div>
        <div>
          <dt>Duração</dt>
          <dd>{request.durationMinutes} minutos</dd>
        </div>
        <div>
          <dt>Motivo do cancelamento</dt>
          <dd>{cancelReason}</dd>
        </div>
        {request.reasonText ? (
          <div>
            <dt>Detalhes</dt>
            <dd>{request.reasonText}</dd>
          </div>
        ) : null}
        <div>
          <dt>Solicitado em</dt>
          <dd>{dateFormatter.format(new Date(request.submittedAt))}</dd>
        </div>
      </dl>

      <div className="review-rejection-field">
        <label htmlFor={noteId}>Observação administrativa (opcional)</label>
        <textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Registre contexto da decisão, se necessário."
          rows={2}
          disabled={controlsDisabled}
        />
      </div>

      {message ? (
        <p
          className={
            status === "success"
              ? "review-feedback review-feedback-success"
              : "review-feedback review-feedback-error"
          }
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <div className="review-card-actions">
        <button
          className="review-button review-button-reject"
          type="button"
          onClick={() => decide("rejected")}
          disabled={controlsDisabled}
        >
          {isPending ? "Salvando…" : "Manter atendimento"}
        </button>
        <button
          className="review-button review-button-approve"
          type="button"
          onClick={() => decide("approved")}
          disabled={controlsDisabled}
        >
          {isPending ? "Salvando…" : "Aprovar cancelamento"}
        </button>
      </div>
    </article>
  );
}

"use client";

import { useId, useState, useTransition } from "react";

import { requestOrCancelAppointmentAction } from "@/actions/cancellations";
import { CANCEL_REASONS } from "@/lib/domain/reasons";
import type { CancellationReasonCode } from "@/types/database";

type CancelDialogProps = {
  appointmentId: string;
  triggerLabel?: string;
  onCompleted?: () => void;
};

export function CancelDialog({
  appointmentId,
  triggerLabel = "Cancelar atendimento",
  onCompleted,
}: CancelDialogProps) {
  const reasonId = useId();
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<CancellationReasonCode>(
    CANCEL_REASONS[0]?.value ?? "imprevisto",
  );
  const [reasonText, setReasonText] = useState("");
  const [feedback, setFeedback] = useState<string>();
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">("error");
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    if (isPending) {
      return;
    }
    setOpen(false);
    setFeedback(undefined);
  }

  function submitCancellation() {
    setFeedback(undefined);

    startTransition(async () => {
      const result = await requestOrCancelAppointmentAction({
        appointmentId,
        reasonCode,
        reasonText,
      });

      if (!result.ok) {
        setFeedbackKind("error");
        setFeedback(result.error);
        return;
      }

      setFeedbackKind("success");
      setFeedback(result.message);
      onCompleted?.();
    });
  }

  return (
    <>
      <button
        className="cancel-trigger"
        type="button"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="cancel-dialog-backdrop" role="presentation" onClick={closeDialog}>
          <div
            className="cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cancel-dialog__header">
              <h2 id="cancel-dialog-title">Cancelar atendimento</h2>
              <button
                className="cancel-dialog__close"
                type="button"
                onClick={closeDialog}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="cancel-dialog__body">
              <div className="appointment-field">
                <label htmlFor={reasonId}>Motivo</label>
                <select
                  id={reasonId}
                  value={reasonCode}
                  disabled={isPending}
                  onChange={(event) =>
                    setReasonCode(event.target.value as CancellationReasonCode)
                  }
                >
                  {CANCEL_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="appointment-field">
                <label htmlFor={detailsId}>Detalhes (opcional)</label>
                <textarea
                  id={detailsId}
                  rows={3}
                  value={reasonText}
                  disabled={isPending}
                  onChange={(event) => setReasonText(event.target.value)}
                  placeholder="Explique brevemente o motivo."
                />
              </div>

              {feedback ? (
                <p
                  className={
                    feedbackKind === "success"
                      ? "appointment-form-success"
                      : "auth-error"
                  }
                  role="status"
                >
                  {feedback}
                </p>
              ) : null}
            </div>

            <footer className="cancel-dialog__footer">
              <button
                className="cancel-dialog__secondary"
                type="button"
                disabled={isPending}
                onClick={closeDialog}
              >
                Voltar
              </button>
              <button
                className="auth-submit"
                type="button"
                disabled={isPending}
                onClick={submitCancellation}
              >
                {isPending ? "Enviando…" : "Confirmar cancelamento"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}

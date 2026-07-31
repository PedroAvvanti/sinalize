"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { reviewInterpreterApplication } from "@/actions/interpreters";

type InterpreterReviewCardProps = {
  application: {
    id: string;
    interpreterName: string;
    submittedAt: string;
    certificateUrl: string | null;
  };
};

export function InterpreterReviewCard({
  application,
}: InterpreterReviewCardProps) {
  const router = useRouter();
  const reasonId = useId();
  const reasonHintId = useId();
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function review(decision: "approved" | "rejected") {
    setMessage(null);
    startTransition(async () => {
      const result = await reviewInterpreterApplication({
        id: application.id,
        decision,
        rejectionReason,
      });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setReviewed(true);
      setMessage(
        decision === "approved"
          ? "Candidatura aprovada."
          : "Candidatura rejeitada.",
      );
      router.refresh();
    });
  }

  const controlsDisabled = isPending || reviewed;

  return (
    <article className="interpreter-review-card">
      <div className="review-card-signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="review-card-body">
        <div className="review-card-heading">
          <div>
            <p className="review-card-label">Aguardando decisão</p>
            <h2>{application.interpreterName}</h2>
          </div>
          <time dateTime={application.submittedAt}>
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(application.submittedAt))}
          </time>
        </div>

        {application.certificateUrl ? (
          <a
            className="certificate-review-link"
            href={application.certificateUrl}
            target="_blank"
            rel="noreferrer"
          >
            Abrir certificado
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="certificate-link-error" role="status">
            O certificado está temporariamente indisponível. Recarregue a
            página para gerar um novo link.
          </p>
        )}

        <div className="review-rejection-field">
          <label htmlFor={reasonId}>Motivo da rejeição</label>
          <textarea
            id={reasonId}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Explique objetivamente o que precisa ser corrigido."
            rows={3}
            disabled={controlsDisabled}
            aria-describedby={reasonHintId}
          />
          <span id={reasonHintId}>Obrigatório somente ao rejeitar.</span>
        </div>

        {message ? (
          <p
            className={
              message.endsWith("aprovada.") || message.endsWith("rejeitada.")
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
            onClick={() => review("rejected")}
            disabled={controlsDisabled}
          >
            {isPending ? "Salvando…" : "Rejeitar"}
          </button>
          <button
            className="review-button review-button-approve"
            type="button"
            onClick={() => review("approved")}
            disabled={controlsDisabled}
          >
            {isPending ? "Salvando…" : "Aprovar intérprete"}
          </button>
        </div>
      </div>
    </article>
  );
}

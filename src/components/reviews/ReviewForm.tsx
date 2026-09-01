"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";

import { submitReviewAction } from "@/actions/reviews";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";

type ReviewFormProps = {
  appointmentId: string;
  toProfileId: string;
  recipientName: string;
  homeHref: string;
};

const ratingOptions = [1, 2, 3, 4, 5] as const;

const starLabels: Record<(typeof ratingOptions)[number], string> = {
  1: "1 estrela — muito ruim",
  2: "2 estrelas — ruim",
  3: "3 estrelas — regular",
  4: "4 estrelas — boa",
  5: "5 estrelas — excelente",
};

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M12 2.5 14.9 9l7.4.6-5.6 4.8 1.7 7.2L12 17.8 5.6 21.6l1.7-7.2L1.7 9.6 9.1 9 12 2.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReviewForm({
  appointmentId,
  toProfileId,
  recipientName,
  homeHref,
}: ReviewFormProps) {
  const commentId = useId();
  const ratingErrorId = useId();
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayRating = hoverRating ?? rating ?? 0;

  function submitReview() {
    if (rating === null) {
      setRatingError("Escolha uma nota de 1 a 5 estrelas.");
      setFeedback(undefined);
      return;
    }

    setRatingError(undefined);
    setFeedback(undefined);

    startTransition(async () => {
      const result = await submitReviewAction({
        appointmentId,
        toProfileId,
        rating,
        comment,
      });

      if (!result.ok) {
        setFeedback(result.error);
        return;
      }

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="review-form review-form-success" role="status">
        <h2>Obrigado pela avaliação</h2>
        <p>Sua nota foi registrada e ajuda a melhorar os atendimentos.</p>
        <Link className="user-request-link" href={homeHref}>
          Voltar ao início <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <form
      className="review-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submitReview();
      }}
    >
      <p className="review-form__lead">
        Como foi o atendimento com{" "}
        <strong>{recipientName.trim() || "seu parceiro"}</strong>?
      </p>

      <fieldset
        className={`review-form__rating${ratingError ? " review-form__rating--invalid" : ""}`}
      >
        <legend>
          Nota
          <RequiredMark />
        </legend>
        <div
          className="review-form__stars"
          role="radiogroup"
          aria-label="Nota de 1 a 5 estrelas"
          aria-describedby={ratingError ? ratingErrorId : undefined}
          onMouseLeave={() => setHoverRating(null)}
        >
          {ratingOptions.map((value) => (
            <label
              key={value}
              className="review-form__star"
              title={starLabels[value]}
              onMouseEnter={() => setHoverRating(value)}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                disabled={isPending}
                aria-label={starLabels[value]}
                onChange={() => {
                  setRating(value);
                  setRatingError(undefined);
                }}
              />
              <StarGlyph filled={value <= displayRating} />
            </label>
          ))}
        </div>
        {ratingError ? (
          <FieldError id={ratingErrorId} message={ratingError} />
        ) : null}
      </fieldset>

      <div className="appointment-field">
        <label htmlFor={commentId}>Comentário (opcional)</label>
        <textarea
          id={commentId}
          rows={4}
          value={comment}
          disabled={isPending}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Este comentário é privado: só você, a pessoa avaliada e a administração podem ler."
        />
      </div>

      {feedback ? (
        <p className="auth-error" role="alert">
          {feedback}
        </p>
      ) : null}

      <button className="auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}

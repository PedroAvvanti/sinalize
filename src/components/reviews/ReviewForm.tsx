"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";

import { submitReviewAction } from "@/actions/reviews";

type ReviewFormProps = {
  appointmentId: string;
  toProfileId: string;
  recipientName: string;
  homeHref: string;
};

const ratingOptions = [1, 2, 3, 4, 5] as const;

export function ReviewForm({
  appointmentId,
  toProfileId,
  recipientName,
  homeHref,
}: ReviewFormProps) {
  const commentId = useId();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submitReview() {
    if (rating === null) {
      setFeedback("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }

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
      onSubmit={(event) => {
        event.preventDefault();
        submitReview();
      }}
    >
      <p className="review-form__lead">
        Como foi o atendimento com{" "}
        <strong>{recipientName.trim() || "seu parceiro"}</strong>?
      </p>

      <fieldset className="review-form__rating">
        <legend>Nota</legend>
        <div className="review-form__stars" role="radiogroup" aria-label="Nota">
          {ratingOptions.map((value) => (
            <label key={value} className="review-form__star">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                disabled={isPending}
                onChange={() => setRating(value)}
              />
              <span aria-hidden="true">{value}</span>
            </label>
          ))}
        </div>
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

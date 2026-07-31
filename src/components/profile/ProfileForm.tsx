"use client";

import { useId, useState, useTransition } from "react";

import { updateProfileAction } from "@/actions/profile";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type ProfileFormProps = {
  initialName: string;
  averageRating: number | null;
  roleLabel: string;
};

export function ProfileForm({
  initialName,
  averageRating,
  roleLabel,
}: ProfileFormProps) {
  const nameId = useId();
  const [fullName, setFullName] = useState(initialName);
  const [feedback, setFeedback] = useState<string>();
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">("success");
  const [isPending, startTransition] = useTransition();

  function saveProfile() {
    setFeedback(undefined);

    startTransition(async () => {
      const result = await updateProfileAction({ fullName });

      if (!result.ok) {
        setFeedbackKind("error");
        setFeedback(result.error);
        return;
      }

      setFeedbackKind("success");
      setFeedback("Perfil atualizado.");
    });
  }

  return (
    <div className="profile-form">
      <dl className="profile-form__meta">
        <div>
          <dt>Papel</dt>
          <dd>{roleLabel}</dd>
        </div>
        {averageRating !== null ? (
          <div>
            <dt>Média de avaliações</dt>
            <dd>{averageRating.toFixed(2)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="appointment-field">
        <label htmlFor={nameId}>Nome completo</label>
        <input
          id={nameId}
          type="text"
          value={fullName}
          disabled={isPending}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="profile-form__theme">
        <p className="profile-form__theme-label">Tema da interface</p>
        <ThemeToggle />
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

      <button
        className="auth-submit"
        type="button"
        disabled={isPending}
        onClick={saveProfile}
      >
        {isPending ? "Salvando…" : "Salvar perfil"}
      </button>
    </div>
  );
}

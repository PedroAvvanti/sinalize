"use client";

import { useId, useRef, useState, useTransition } from "react";

import { updateProfileAction } from "@/actions/profile";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";
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
  const nameErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initialName);
  const [nameError, setNameError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">(
    "success",
  );
  const [isPending, startTransition] = useTransition();

  function saveProfile() {
    const trimmed = fullName.trim();

    if (!trimmed) {
      setNameError("Informe seu nome completo.");
      setFeedback(undefined);
      nameRef.current?.focus();
      return;
    }

    setNameError(undefined);
    setFeedback(undefined);

    startTransition(async () => {
      const result = await updateProfileAction({ fullName: trimmed });

      if (!result.ok) {
        if (result.error.toLowerCase().includes("nome")) {
          setNameError(result.error);
          nameRef.current?.focus();
          return;
        }
        setFeedbackKind("error");
        setFeedback(result.error);
        return;
      }

      setFullName(trimmed);
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

      <div
        className={`appointment-field${nameError ? " appointment-field--invalid" : ""}`}
      >
        <label htmlFor={nameId}>
          Nome completo
          <RequiredMark />
        </label>
        <input
          ref={nameRef}
          id={nameId}
          type="text"
          value={fullName}
          disabled={isPending}
          required
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          onChange={(event) => {
            setFullName(event.target.value);
            setNameError(undefined);
          }}
          autoComplete="name"
        />
        {nameError ? (
          <FieldError id={nameErrorId} message={nameError} />
        ) : null}
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

"use client";

import { useActionState, useId, useRef, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/actions/auth";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";

const INITIAL_STATE: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar link"}
    </button>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    INITIAL_STATE,
  );
  const emailErrorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      event.preventDefault();
      emailRef.current?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      event.preventDefault();
      emailRef.current?.focus();
    }
  }

  return (
    <form
      className="auth-form"
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="auth-field">
        <label htmlFor="email">
          E-mail
          <RequiredMark />
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={emailErrorId}
        />
        <span id={emailErrorId} className="appointment-field-hint">
          Enviaremos um link para redefinir sua senha.
        </span>
      </div>

      {state.error ? (
        <p className="auth-error auth-error-ios" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="appointment-form-success" role="status" aria-live="polite">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

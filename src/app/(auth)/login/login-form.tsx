"use client";

import { useActionState, useId, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, type AuthActionState } from "@/actions/auth";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";

const INITIAL_STATE: AuthActionState = {};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState(signInAction, INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const errors: LoginFieldErrors = {};

    if (!email) {
      errors.email = "Informe seu e-mail.";
    } else if (!isValidEmail(email)) {
      errors.email = "Informe um e-mail válido.";
    }

    if (!password) {
      errors.password = "Informe sua senha.";
    }

    if (errors.email || errors.password) {
      event.preventDefault();
      setFieldErrors(errors);
      if (errors.email) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
  }

  return (
    <form
      className="auth-form"
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
    >
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <div
        className={`auth-field${fieldErrors.email ? " auth-field--invalid" : ""}`}
      >
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
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? emailErrorId : undefined}
          onChange={() =>
            setFieldErrors((current) => {
              if (!current.email) {
                return current;
              }
              const next = { ...current };
              delete next.email;
              return next;
            })
          }
        />
        {fieldErrors.email ? (
          <FieldError id={emailErrorId} message={fieldErrors.email} />
        ) : null}
      </div>

      <div
        className={`auth-field${fieldErrors.password ? " auth-field--invalid" : ""}`}
      >
        <label htmlFor="password">
          Senha
          <RequiredMark />
        </label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={
            fieldErrors.password ? passwordErrorId : undefined
          }
          onChange={() =>
            setFieldErrors((current) => {
              if (!current.password) {
                return current;
              }
              const next = { ...current };
              delete next.password;
              return next;
            })
          }
        />
        {fieldErrors.password ? (
          <FieldError id={passwordErrorId} message={fieldErrors.password} />
        ) : null}
      </div>

      {state.error ? (
        <p className="auth-error auth-error-ios" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

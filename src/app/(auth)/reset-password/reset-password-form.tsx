"use client";

import { useActionState, useId, useRef, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

import { updatePasswordAction, type AuthActionState } from "@/actions/auth";
import { PasswordField } from "@/components/auth/PasswordField";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { authMessageFor } from "@/lib/auth/policy";

const INITIAL_STATE: AuthActionState = {};
const PASSWORD_TOO_SHORT = authMessageFor("password_too_short");
const PASSWORD_MISMATCH = authMessageFor("password_mismatch");

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar nova senha"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, INITIAL_STATE);
  const passwordErrorId = useId();
  const confirmErrorId = useId();
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");

    if (!password) {
      event.preventDefault();
      passwordRef.current?.focus();
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      event.preventDefault();
      passwordRef.current?.focus();
      return;
    }

    if (password !== passwordConfirm) {
      event.preventDefault();
      confirmRef.current?.focus();
    }
  }

  const passwordError =
    state.fieldErrors?.password ??
    (state.error === PASSWORD_TOO_SHORT ? state.error : undefined);
  const confirmError =
    state.fieldErrors?.password_confirm ??
    (state.error === PASSWORD_MISMATCH ? state.error : undefined);
  const formError =
    state.error &&
    state.error !== PASSWORD_TOO_SHORT &&
    state.error !== PASSWORD_MISMATCH
      ? state.error
      : null;

  return (
    <form
      className="auth-form"
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
    >
      <PasswordField
        id="password"
        name="password"
        label="Nova senha"
        describedBy="reset-password-help"
        help={`Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
        error={passwordError}
        inputRef={passwordRef}
      />

      <PasswordField
        id="password_confirm"
        name="password_confirm"
        label="Confirmar nova senha"
        error={confirmError}
        inputRef={confirmRef}
      />

      <span id="reset-password-help" className="sr-only">
        A senha deve ter pelo menos {MIN_PASSWORD_LENGTH} caracteres.
      </span>

      {formError ? (
        <p className="auth-error auth-error-ios" role="alert" aria-live="polite">
          {formError}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

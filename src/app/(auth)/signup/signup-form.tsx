"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

import { signUpAction, type AuthActionState } from "@/actions/auth";
import { PasswordField } from "@/components/auth/PasswordField";
import { authMessageFor } from "@/lib/auth/policy";

const INITIAL_STATE: AuthActionState = {};
const PASSWORD_MISMATCH = authMessageFor("password_mismatch");
const PASSWORD_TOO_SHORT = authMessageFor("password_too_short");
const MIN_PASSWORD_LENGTH = 6;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? "Criando conta…" : "Criar conta"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, INITIAL_STATE);
  const [passwordTooShort, setPasswordTooShort] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const passwordError = passwordTooShort
    ? PASSWORD_TOO_SHORT
    : state.fieldErrors?.password;
  const confirmError = passwordMismatch
    ? PASSWORD_MISMATCH
    : state.fieldErrors?.password_confirm;
  const formError =
    state.error && !state.fieldErrors?.password && !state.fieldErrors?.password_confirm
      ? state.error
      : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");

    if (password.length < MIN_PASSWORD_LENGTH) {
      event.preventDefault();
      setPasswordTooShort(true);
      setPasswordMismatch(false);
      return;
    }

    if (password !== passwordConfirm) {
      event.preventDefault();
      setPasswordTooShort(false);
      setPasswordMismatch(true);
      return;
    }

    setPasswordTooShort(false);
    setPasswordMismatch(false);
  }

  function clearPasswordErrors() {
    if (passwordTooShort) {
      setPasswordTooShort(false);
    }
    if (passwordMismatch) {
      setPasswordMismatch(false);
    }
  }

  return (
    <form
      key={state.resetKey ?? "signup"}
      className="auth-form"
      action={formAction}
      onSubmit={handleSubmit}
    >
      <div className="auth-field">
        <label htmlFor="full_name">Nome completo</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={state.values?.full_name}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
        />
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Senha"
        describedBy="password-help"
        help="Use pelo menos 6 caracteres."
        error={passwordError}
        defaultValue={state.values?.password}
        onChange={clearPasswordErrors}
      />

      <PasswordField
        id="password_confirm"
        name="password_confirm"
        label="Confirmar senha"
        error={confirmError}
        defaultValue={state.values?.password_confirm}
        onChange={clearPasswordErrors}
      />

      <fieldset className="auth-role-group">
        <legend className="auth-role-group__legend">
          <span className="auth-role-group__title">Como você vai usar o Sinalize?</span>
          <span className="auth-role-group__hint">Escolha uma opção — não é possível marcar as duas</span>
        </legend>

        <label className="auth-role-card auth-role-card--user">
          <input
            type="radio"
            name="role"
            value="user"
            defaultChecked={(state.values?.role ?? "user") === "user"}
          />
          <span className="auth-role-card__badge">Usuário</span>
          <span className="auth-role-card__title">Preciso de intérprete</span>
          <span className="auth-role-card__desc">
            Solicito atendimentos em Libras por videochamada.
          </span>
        </label>

        <label className="auth-role-card auth-role-card--interpreter">
          <input
            type="radio"
            name="role"
            value="interpreter"
            defaultChecked={state.values?.role === "interpreter"}
          />
          <span className="auth-role-card__badge">Profissional</span>
          <span className="auth-role-card__title">Sou intérprete de Libras</span>
          <span className="auth-role-card__desc">
            Aceito pedidos na fila e atendo pela plataforma.
          </span>
        </label>
      </fieldset>

      <div className="auth-legal-section" role="group" aria-labelledby="legal-section-title">
        <p className="auth-legal-section__title" id="legal-section-title">
          Declaração obrigatória
        </p>
        <p className="auth-legal-section__hint">
          Confirmação separada do tipo de conta acima.
        </p>
        <label className="auth-legal-checkbox">
          <input type="checkbox" name="is_adult" required />
          <span className="auth-legal-checkbox__content">
            <strong>Confirmo ter 18 anos ou mais</strong>
            <small>Exigido para criar qualquer conta no Sinalize.</small>
          </span>
        </label>
      </div>

      {formError ? (
        <p className="auth-error auth-error-ios" role="alert" aria-live="polite">
          {formError}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

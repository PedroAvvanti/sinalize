"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signUpAction, type AuthActionState } from "@/actions/auth";

const INITIAL_STATE: AuthActionState = {};

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

  return (
    <form className="auth-form" action={formAction}>
      <div className="auth-field">
        <label htmlFor="full_name">Nome completo</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
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
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          aria-describedby="password-help"
          required
        />
        <span id="password-help">Use pelo menos 6 caracteres.</span>
      </div>

      <fieldset className="auth-role-group">
        <legend>Tipo de conta</legend>
        <label>
          <input type="radio" name="role" value="user" defaultChecked />
          Quero solicitar intérpretes
        </label>
        <label>
          <input type="radio" name="role" value="interpreter" />
          Sou intérprete de Libras
        </label>
      </fieldset>

      <label className="auth-checkbox">
        <input type="checkbox" name="is_adult" required />
        <span>Tenho 18 anos ou mais</span>
      </label>

      {state.error ? (
        <p className="auth-error" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

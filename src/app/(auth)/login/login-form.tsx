"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, type AuthActionState } from "@/actions/auth";

const INITIAL_STATE: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form className="auth-form" action={formAction}>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

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
          autoComplete="current-password"
          required
        />
      </div>

      {state.error ? (
        <p className="auth-error" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

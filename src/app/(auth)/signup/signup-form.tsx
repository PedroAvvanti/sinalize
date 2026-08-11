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
        <legend className="auth-role-group__legend">
          <span className="auth-role-group__title">Como você vai usar o Sinalize?</span>
          <span className="auth-role-group__hint">Escolha uma opção — não é possível marcar as duas</span>
        </legend>

        <label className="auth-role-card auth-role-card--user">
          <input type="radio" name="role" value="user" defaultChecked />
          <span className="auth-role-card__badge">Usuário</span>
          <span className="auth-role-card__title">Preciso de intérprete</span>
          <span className="auth-role-card__desc">
            Solicito atendimentos em Libras por videochamada.
          </span>
        </label>

        <label className="auth-role-card auth-role-card--interpreter">
          <input type="radio" name="role" value="interpreter" />
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

      {state.error ? (
        <p className="auth-error auth-error-ios" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { finalizeSignupRoleAction } from "@/actions/auth";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  authMessageFor,
  validatePasswordConfirmation,
  validateSignupEligibility,
} from "@/lib/auth/policy";
import { homePathForRole, type ProfileRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_MISMATCH = authMessageFor("password_mismatch");
const PASSWORD_TOO_SHORT = authMessageFor("password_too_short");
const MIN_PASSWORD_LENGTH = 6;

type FormValues = {
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
  role: string;
};

type FormState = {
  error?: string;
  fieldErrors?: {
    password?: string;
    password_confirm?: string;
  };
  values?: FormValues;
  resetKey?: string;
};

const INITIAL_VALUES: FormValues = {
  full_name: "",
  email: "",
  password: "",
  password_confirm: "",
  role: "user",
};

export function SignupForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const [passwordTooShort, setPasswordTooShort] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const values = state.values ?? INITIAL_VALUES;
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

  function clearPasswordErrors() {
    if (passwordTooShort) {
      setPasswordTooShort(false);
    }
    if (passwordMismatch) {
      setPasswordMismatch(false);
    }
  }

  function fail(
    nextValues: FormValues,
    payload: Pick<FormState, "error" | "fieldErrors">,
  ) {
    setState({
      ...payload,
      values: nextValues,
      resetKey: `${Date.now()}`,
    });
    setPending(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");
    const requestedRole = String(formData.get("role") ?? "").trim();
    const adult = formData.get("is_adult") === "on";
    const nextValues: FormValues = {
      full_name: fullName,
      email,
      password,
      password_confirm: passwordConfirm,
      role: requestedRole,
    };

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordTooShort(true);
      setPasswordMismatch(false);
      return;
    }

    const confirmation = validatePasswordConfirmation(password, passwordConfirm);
    if (!confirmation.ok) {
      setPasswordTooShort(false);
      setPasswordMismatch(true);
      return;
    }

    setPasswordTooShort(false);
    setPasswordMismatch(false);

    const eligibility = validateSignupEligibility(requestedRole, adult);
    if (!eligibility.ok) {
      fail(nextValues, { error: eligibility.error });
      return;
    }

    if (!fullName || !email || !password) {
      fail(nextValues, { error: "Preencha nome, e-mail e senha." });
      return;
    }

    const role = eligibility.role as Exclude<ProfileRole, "admin">;
    setPending(true);
    setState({ values: nextValues });

    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      console.error("Falha no cadastro pelo provedor de autenticação.", {
        code: error.code,
        status: error.status,
      });
      fail(nextValues, { error: authMessageFor("signup_failed") });
      return;
    }

    // Cadastro repetido pode devolver usuário ofuscado sem identities.
    if (data.user?.identities?.length) {
      await finalizeSignupRoleAction(data.user.id, role);
    }

    if (data.session) {
      router.replace(homePathForRole(role));
      return;
    }

    router.replace("/confirm");
  }

  return (
    <form
      key={state.resetKey ?? "signup"}
      className="auth-form"
      onSubmit={handleSubmit}
    >
      <div className="auth-field">
        <label htmlFor="full_name">Nome completo</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={values.full_name}
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
          defaultValue={values.email}
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
        defaultValue={values.password}
        onChange={clearPasswordErrors}
      />

      <PasswordField
        id="password_confirm"
        name="password_confirm"
        label="Confirmar senha"
        error={confirmError}
        defaultValue={values.password_confirm}
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
            defaultChecked={(values.role || "user") === "user"}
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
            defaultChecked={values.role === "interpreter"}
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

      <button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}

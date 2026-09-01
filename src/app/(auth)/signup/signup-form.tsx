"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import { finalizeSignupRoleAction, assertSignupRateLimitAction } from "@/actions/auth";
import { PasswordField } from "@/components/auth/PasswordField";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";
import {
  authMessageFor,
  validatePasswordConfirmation,
  validateSignupEligibility,
} from "@/lib/auth/policy";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { homePathForRole, type ProfileRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_MISMATCH = authMessageFor("password_mismatch");
const PASSWORD_TOO_SHORT = authMessageFor("password_too_short");

type FormValues = {
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
  role: string;
};

type FieldErrors = {
  full_name?: string;
  email?: string;
  password?: string;
  password_confirm?: string;
  is_adult?: string;
};

type FormState = {
  error?: string;
  fieldErrors?: FieldErrors;
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SignupForm() {
  const router = useRouter();
  const adultErrorId = useId();
  const nameErrorId = useId();
  const emailErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const adultRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const [passwordTooShort, setPasswordTooShort] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [clientFieldErrors, setClientFieldErrors] = useState<FieldErrors>({});

  const values = state.values ?? INITIAL_VALUES;
  const passwordError = passwordTooShort
    ? PASSWORD_TOO_SHORT
    : clientFieldErrors.password ?? state.fieldErrors?.password;
  const confirmError = passwordMismatch
    ? PASSWORD_MISMATCH
    : clientFieldErrors.password_confirm ?? state.fieldErrors?.password_confirm;
  const formError =
    state.error &&
    !state.fieldErrors?.password &&
    !state.fieldErrors?.password_confirm
      ? state.error
      : null;

  function clearPasswordErrors() {
    if (passwordTooShort) {
      setPasswordTooShort(false);
    }
    if (passwordMismatch) {
      setPasswordMismatch(false);
    }
    setClientFieldErrors((current) => {
      if (!current.password && !current.password_confirm) {
        return current;
      }
      const next = { ...current };
      delete next.password;
      delete next.password_confirm;
      return next;
    });
  }

  function clearFieldError(field: keyof FieldErrors) {
    setClientFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
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

  function focusFirstInvalid(errors: FieldErrors) {
    if (errors.full_name) {
      nameRef.current?.focus();
      return;
    }
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password || errors.password_confirm) {
      document.getElementById("password")?.focus();
      return;
    }
    if (errors.is_adult) {
      adultRef.current?.focus();
    }
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

    const errors: FieldErrors = {};

    if (!fullName) {
      errors.full_name = "Informe seu nome completo.";
    }

    if (!email) {
      errors.email = "Informe seu e-mail.";
    } else if (!isValidEmail(email)) {
      errors.email = "Informe um e-mail válido.";
    }

    if (!password) {
      errors.password = "Informe uma senha.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = PASSWORD_TOO_SHORT;
    }

    if (!passwordConfirm) {
      errors.password_confirm = "Confirme sua senha.";
    } else {
      const confirmation = validatePasswordConfirmation(
        password,
        passwordConfirm,
      );
      if (!confirmation.ok) {
        errors.password_confirm = confirmation.error;
      }
    }

    if (!adult) {
      errors.is_adult = authMessageFor("adult_required");
    }

    if (
      errors.full_name ||
      errors.email ||
      errors.password ||
      errors.password_confirm ||
      errors.is_adult
    ) {
      setPasswordTooShort(Boolean(errors.password === PASSWORD_TOO_SHORT));
      setPasswordMismatch(
        Boolean(errors.password_confirm === PASSWORD_MISMATCH),
      );
      setClientFieldErrors(errors);
      setState({ values: nextValues });
      focusFirstInvalid(errors);
      return;
    }

    setPasswordTooShort(false);
    setPasswordMismatch(false);
    setClientFieldErrors({});

    const eligibility = validateSignupEligibility(requestedRole, adult);
    if (!eligibility.ok) {
      fail(nextValues, { error: eligibility.error });
      return;
    }

    const role = eligibility.role as Exclude<ProfileRole, "admin">;

    const rateLimit = await assertSignupRateLimitAction(email);
    if (!rateLimit.ok) {
      fail(nextValues, { error: rateLimit.error });
      return;
    }

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
      noValidate
      onSubmit={handleSubmit}
    >
      <div
        className={`auth-field${clientFieldErrors.full_name ? " auth-field--invalid" : ""}`}
      >
        <label htmlFor="full_name">
          Nome completo
          <RequiredMark />
        </label>
        <input
          ref={nameRef}
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={values.full_name}
          required
          aria-invalid={clientFieldErrors.full_name ? true : undefined}
          aria-describedby={
            clientFieldErrors.full_name ? nameErrorId : undefined
          }
          onChange={() => clearFieldError("full_name")}
        />
        {clientFieldErrors.full_name ? (
          <FieldError id={nameErrorId} message={clientFieldErrors.full_name} />
        ) : null}
      </div>

      <div
        className={`auth-field${clientFieldErrors.email ? " auth-field--invalid" : ""}`}
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
          defaultValue={values.email}
          required
          aria-invalid={clientFieldErrors.email ? true : undefined}
          aria-describedby={
            clientFieldErrors.email ? emailErrorId : undefined
          }
          onChange={() => clearFieldError("email")}
        />
        {clientFieldErrors.email ? (
          <FieldError id={emailErrorId} message={clientFieldErrors.email} />
        ) : null}
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Senha"
        describedBy="password-help"
        help={`Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
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
          <span className="auth-role-group__title">
            Como você vai usar o Sinalize?
          </span>
          <span className="auth-role-group__hint">
            Escolha uma opção — não é possível marcar as duas
          </span>
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

      <div
        className="auth-legal-section"
        role="group"
        aria-labelledby="legal-section-title"
      >
        <p className="auth-legal-section__title" id="legal-section-title">
          Declaração obrigatória
          <RequiredMark />
        </p>
        <p className="auth-legal-section__hint">
          Confirmação separada do tipo de conta acima.
        </p>
        <label
          className={`auth-legal-checkbox${clientFieldErrors.is_adult ? " auth-legal-checkbox--invalid" : ""}`}
        >
          <input
            ref={adultRef}
            type="checkbox"
            name="is_adult"
            required
            aria-invalid={clientFieldErrors.is_adult ? true : undefined}
            aria-describedby={
              clientFieldErrors.is_adult ? adultErrorId : undefined
            }
            onChange={() => clearFieldError("is_adult")}
          />
          <span className="auth-legal-checkbox__content">
            <strong>Confirmo ter 18 anos ou mais</strong>
            <small>Exigido para criar qualquer conta no Sinalize.</small>
          </span>
        </label>
        {clientFieldErrors.is_adult ? (
          <FieldError id={adultErrorId} message={clientFieldErrors.is_adult} />
        ) : null}
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

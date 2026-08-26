"use client";

import { useId, useState, type ChangeEventHandler } from "react";

import { FieldError, RequiredMark } from "@/components/forms/FieldError";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  describedBy?: string;
  help?: string;
  error?: string | null;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export function PasswordField({
  id,
  name,
  label,
  autoComplete = "new-password",
  minLength,
  required = true,
  describedBy,
  help,
  error,
  defaultValue,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedHelpId = useId();
  const generatedErrorId = useId();
  const helpId = help ? describedBy ?? generatedHelpId : undefined;
  const errorId = error ? generatedErrorId : undefined;
  const describedByIds = [errorId, helpId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`auth-field${error ? " auth-field--invalid" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <div className="auth-password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          defaultValue={defaultValue}
          aria-describedby={describedByIds}
          aria-invalid={error ? true : undefined}
          required={required}
          onChange={onChange}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 4.8c5 0 9.3 3.1 11 7.2a12.3 12.3 0 0 1-4.2 5.1M6.1 6.1A12.4 12.4 0 0 0 1 12c1.7 4.1 6 7.2 11 7.2 1.4 0 2.8-.2 4-.7"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M1 12c1.7-4.1 6-7.2 11-7.2S20.3 7.9 22 12c-1.7 4.1-6 7.2-11 7.2S2.7 16.1 1 12Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
      </div>
      {error ? <FieldError id={errorId} message={error} /> : null}
      {help ? <span id={helpId}>{help}</span> : null}
    </div>
  );
}

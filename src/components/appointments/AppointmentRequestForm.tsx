"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { createAppointmentAction } from "@/actions/appointments";
import { IosDateTimePicker } from "@/components/appointments/IosDateTimePicker";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";
import {
  hasAppointmentRequestFieldErrors,
  validateAppointmentRequestForm,
  type AppointmentRequestFieldErrors,
} from "@/lib/domain/appointment-request-form";
import {
  APPOINTMENT_REASONS,
  REASON_CUSTOM_TITLE_MAX_LENGTH,
  REASON_TEXT_MAX_LENGTH,
  appointmentReasonFormLabel,
} from "@/lib/domain/reasons";

const DURATION_PRESETS = [15, 30, 60] as const;

function minimumLocalDateTime() {
  const now = new Date(Date.now() + 60_000);
  now.setSeconds(0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function ChevronIcon() {
  return (
    <svg
      className="reason-combobox__chevron"
      viewBox="0 0 20 20"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5.25 7.5 10 12.25 14.75 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppointmentRequestForm() {
  const router = useRouter();
  const reasonFieldId = useId();
  const reasonErrorId = useId();
  const durationErrorId = useId();
  const scheduledAtErrorId = useId();
  const menuId = useId();
  const comboboxRef = useRef<HTMLDivElement>(null);
  const reasonSelectRef = useRef<HTMLSelectElement>(null);
  const customTitleRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const scheduledAtRef = useRef<HTMLDivElement>(null);
  const [minimumScheduledAt] = useState(minimumLocalDateTime);
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [reasonCode, setReasonCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AppointmentRequestFieldErrors>(
    {},
  );
  const [message, setMessage] = useState<
    { kind: "error"; text: string } | undefined
  >();
  const [isPending, startTransition] = useTransition();
  const isCustomReason = reasonCode === "outro";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function clearFieldError(field: keyof AppointmentRequestFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function selectReason(nextCode: string) {
    setReasonCode(nextCode);
    clearFieldError("reason");
    setMenuOpen(false);
    if (nextCode !== "outro") {
      setCustomTitle("");
    }
  }

  function focusFirstInvalid(errors: AppointmentRequestFieldErrors) {
    if (errors.reason) {
      if (reasonCode === "outro") {
        customTitleRef.current?.focus();
      } else {
        reasonSelectRef.current?.focus();
      }
      return;
    }

    if (errors.durationMinutes) {
      durationRef.current?.focus();
      return;
    }

    if (errors.scheduledAt) {
      scheduledAtRef.current
        ?.querySelector<HTMLButtonElement>("button.ios-dt__trigger")
        ?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsedDuration = Number(formData.get("durationMinutes"));
    const reasonText = String(formData.get("reasonText") ?? "");
    const errors = validateAppointmentRequestForm({
      reasonCode,
      customTitle,
      durationMinutes: parsedDuration,
      scheduledAt,
    });

    setFieldErrors(errors);

    if (hasAppointmentRequestFieldErrors(errors)) {
      focusFirstInvalid(errors);
      return;
    }

    const parsedScheduledAt = new Date(scheduledAt);

    startTransition(async () => {
      const result = await createAppointmentAction({
        scheduledAt: parsedScheduledAt.toISOString(),
        durationMinutes: parsedDuration,
        reasonCode,
        reasonCustomTitle: customTitle,
        reasonText,
      });

      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }

      form.reset();
      setScheduledAt("");
      setDurationMinutes("30");
      setReasonCode("");
      setCustomTitle("");
      setMenuOpen(false);
      setFieldErrors({});
      router.push("/app/user");
      router.refresh();
    });
  }

  return (
    <form className="appointment-form" noValidate onSubmit={handleSubmit}>
      <div
        className={`appointment-field${fieldErrors.reason ? " appointment-field--invalid" : ""}`}
      >
        <label htmlFor={isCustomReason ? reasonFieldId : "reasonCode"}>
          Motivo do atendimento
          <RequiredMark />
        </label>

        {isCustomReason ? (
          <div className="reason-combobox" ref={comboboxRef}>
            <input
              ref={customTitleRef}
              id={reasonFieldId}
              type="text"
              value={customTitle}
              required
              maxLength={REASON_CUSTOM_TITLE_MAX_LENGTH}
              placeholder="Digite o motivo do atendimento"
              disabled={isPending}
              autoComplete="off"
              aria-invalid={fieldErrors.reason ? true : undefined}
              aria-describedby={
                fieldErrors.reason ? reasonErrorId : undefined
              }
              onChange={(event) => {
                setCustomTitle(event.target.value);
                clearFieldError("reason");
              }}
            />
            <button
              className="reason-combobox__toggle"
              type="button"
              disabled={isPending}
              aria-label="Trocar motivo do atendimento"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <ChevronIcon />
            </button>
            {menuOpen ? (
              <ul
                id={menuId}
                className="reason-combobox__menu"
                role="listbox"
                aria-label="Motivos do atendimento"
              >
                {APPOINTMENT_REASONS.map((reason) => (
                  <li key={reason.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={reason.value === reasonCode}
                      className={
                        reason.value === "outro"
                          ? "reason-combobox__option reason-combobox__option--active"
                          : "reason-combobox__option"
                      }
                      onClick={() => selectReason(reason.value)}
                    >
                      {appointmentReasonFormLabel(reason)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <select
            ref={reasonSelectRef}
            id="reasonCode"
            value={reasonCode}
            required
            disabled={isPending}
            aria-invalid={fieldErrors.reason ? true : undefined}
            aria-describedby={
              fieldErrors.reason ? reasonErrorId : undefined
            }
            onChange={(event) => selectReason(event.target.value)}
          >
            <option value="" disabled>
              Selecione um motivo
            </option>
            {APPOINTMENT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {appointmentReasonFormLabel(reason)}
              </option>
            ))}
          </select>
        )}
        {fieldErrors.reason ? (
          <FieldError id={reasonErrorId} message={fieldErrors.reason} />
        ) : null}
      </div>

      <div
        className={`appointment-field${fieldErrors.durationMinutes ? " appointment-field--invalid" : ""}`}
      >
        <label htmlFor="durationMinutes">
          Duração (minutos)
          <RequiredMark />
        </label>
        <div className="duration-presets" role="group" aria-label="Durações sugeridas">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={
                durationMinutes === String(preset)
                  ? "duration-presets__chip duration-presets__chip--active"
                  : "duration-presets__chip"
              }
              disabled={isPending}
              aria-pressed={durationMinutes === String(preset)}
              onClick={() => {
                setDurationMinutes(String(preset));
                clearFieldError("durationMinutes");
              }}
            >
              {preset} min
            </button>
          ))}
        </div>
        <input
          ref={durationRef}
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={durationMinutes}
          required
          disabled={isPending}
          aria-invalid={fieldErrors.durationMinutes ? true : undefined}
          aria-describedby={
            fieldErrors.durationMinutes ? durationErrorId : undefined
          }
          onChange={(event) => {
            setDurationMinutes(event.target.value);
            clearFieldError("durationMinutes");
          }}
        />
        {fieldErrors.durationMinutes ? (
          <FieldError
            id={durationErrorId}
            message={fieldErrors.durationMinutes}
          />
        ) : (
          <span className="appointment-field-hint">
            Sugestões: 15, 30 ou 60 minutos. Você também pode informar outro valor.
          </span>
        )}
      </div>

      <div
        className={`appointment-field${fieldErrors.scheduledAt ? " appointment-field--invalid" : ""}`}
      >
        <label htmlFor="scheduledAt">
          Data e hora
          <RequiredMark />
        </label>
        <div ref={scheduledAtRef}>
          <IosDateTimePicker
            id="scheduledAt"
            name="scheduledAt"
            min={minimumScheduledAt}
            value={scheduledAt}
            onChange={(next) => {
              setScheduledAt(next);
              clearFieldError("scheduledAt");
            }}
            required
            disabled={isPending}
            invalid={Boolean(fieldErrors.scheduledAt)}
            describedBy={
              fieldErrors.scheduledAt ? scheduledAtErrorId : undefined
            }
          />
        </div>
        {fieldErrors.scheduledAt ? (
          <FieldError
            id={scheduledAtErrorId}
            message={fieldErrors.scheduledAt}
          />
        ) : (
          <span className="appointment-field-hint">
            Escolha um horário futuro no seu fuso local.
          </span>
        )}
      </div>

      <div className="appointment-field">
        <label htmlFor="reasonText">Detalhes (opcional)</label>
        <textarea
          id="reasonText"
          name="reasonText"
          rows={4}
          maxLength={REASON_TEXT_MAX_LENGTH}
          disabled={isPending}
          placeholder="Compartilhe informações úteis para o atendimento."
        />
      </div>

      {message ? (
        <p className="auth-error" role="alert" aria-live="polite">
          {message.text}
        </p>
      ) : null}

      <button className="auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Criando solicitação…" : "Solicitar atendimento"}
      </button>
    </form>
  );
}

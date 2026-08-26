"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { createAppointmentAction } from "@/actions/appointments";
import { APPOINTMENT_DURATIONS } from "@/lib/domain/appointments";
import {
  APPOINTMENT_REASONS,
  REASON_CUSTOM_TITLE_MAX_LENGTH,
  REASON_TEXT_MAX_LENGTH,
  appointmentReasonFormLabel,
} from "@/lib/domain/reasons";

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
  const reasonFieldId = useId();
  const menuId = useId();
  const comboboxRef = useRef<HTMLDivElement>(null);
  const [minimumScheduledAt] = useState(minimumLocalDateTime);
  const [reasonCode, setReasonCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState<
    { kind: "error" | "success"; text: string } | undefined
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

  function selectReason(nextCode: string) {
    setReasonCode(nextCode);
    setMenuOpen(false);
    if (nextCode !== "outro") {
      setCustomTitle("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const scheduledAt = String(formData.get("scheduledAt") ?? "");
    const durationMinutes = Number(formData.get("durationMinutes"));
    const reasonText = String(formData.get("reasonText") ?? "");
    const parsedScheduledAt = new Date(scheduledAt);

    if (Number.isNaN(parsedScheduledAt.getTime())) {
      setMessage({ kind: "error", text: "Escolha uma data e hora válidas." });
      return;
    }

    if (!reasonCode) {
      setMessage({ kind: "error", text: "Selecione o motivo do atendimento." });
      return;
    }

    if (isCustomReason && !customTitle.trim()) {
      setMessage({
        kind: "error",
        text: "Digite o motivo do atendimento.",
      });
      return;
    }

    startTransition(async () => {
      const result = await createAppointmentAction({
        scheduledAt: parsedScheduledAt.toISOString(),
        durationMinutes: durationMinutes as 15 | 30 | 60,
        reasonCode,
        reasonCustomTitle: customTitle,
        reasonText,
      });

      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }

      form.reset();
      setReasonCode("");
      setCustomTitle("");
      setMenuOpen(false);
      setMessage({
        kind: "success",
        text: "Solicitação criada. Agora ela está disponível para atendimento.",
      });
    });
  }

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="appointment-field">
        <label htmlFor={isCustomReason ? reasonFieldId : "reasonCode"}>
          Motivo do atendimento
        </label>

        {isCustomReason ? (
          <div className="reason-combobox" ref={comboboxRef}>
            <input
              id={reasonFieldId}
              type="text"
              value={customTitle}
              required
              maxLength={REASON_CUSTOM_TITLE_MAX_LENGTH}
              placeholder="Digite o motivo do atendimento"
              disabled={isPending}
              autoComplete="off"
              onChange={(event) => setCustomTitle(event.target.value)}
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
                      aria-selected={reason.value === "outro"}
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
            id="reasonCode"
            value={reasonCode}
            required
            disabled={isPending}
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
      </div>

      <div className="appointment-field">
        <label htmlFor="durationMinutes">Duração</label>
        <select
          id="durationMinutes"
          name="durationMinutes"
          defaultValue="30"
          required
          disabled={isPending}
        >
          {APPOINTMENT_DURATIONS.map((duration) => (
            <option key={duration} value={duration}>
              {duration} minutos
            </option>
          ))}
        </select>
      </div>

      <div className="appointment-field">
        <label htmlFor="scheduledAt">Data e hora</label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          min={minimumScheduledAt}
          required
          disabled={isPending}
        />
        <span>Escolha um horário futuro no seu fuso local.</span>
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
        <p
          className={
            message.kind === "error"
              ? "auth-error"
              : "appointment-form-success"
          }
          role={message.kind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.text}
        </p>
      ) : null}

      <button className="auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Criando solicitação…" : "Solicitar atendimento"}
      </button>
    </form>
  );
}

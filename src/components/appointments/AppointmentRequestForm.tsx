"use client";

import { useState, useTransition, type FormEvent } from "react";

import { createAppointmentAction } from "@/actions/appointments";
import { APPOINTMENT_DURATIONS } from "@/lib/domain/appointments";
import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";

function minimumLocalDateTime() {
  const now = new Date(Date.now() + 60_000);
  now.setSeconds(0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function AppointmentRequestForm() {
  const [minimumScheduledAt] = useState(minimumLocalDateTime);
  const [message, setMessage] = useState<
    { kind: "error" | "success"; text: string } | undefined
  >();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const scheduledAt = String(formData.get("scheduledAt") ?? "");
    const durationMinutes = Number(formData.get("durationMinutes"));
    const reasonCode = String(formData.get("reasonCode") ?? "");
    const reasonText = String(formData.get("reasonText") ?? "");
    const parsedScheduledAt = new Date(scheduledAt);

    if (Number.isNaN(parsedScheduledAt.getTime())) {
      setMessage({ kind: "error", text: "Escolha uma data e hora válidas." });
      return;
    }

    startTransition(async () => {
      const result = await createAppointmentAction({
        scheduledAt: parsedScheduledAt.toISOString(),
        durationMinutes: durationMinutes as 15 | 30 | 60,
        reasonCode,
        reasonText,
      });

      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }

      form.reset();
      setMessage({
        kind: "success",
        text: "Solicitação criada. Agora ela está disponível para atendimento.",
      });
    });
  }

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="appointment-field">
        <label htmlFor="reasonCode">Motivo do atendimento</label>
        <select id="reasonCode" name="reasonCode" defaultValue="" required>
          <option value="" disabled>
            Selecione um motivo
          </option>
          {APPOINTMENT_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      <div className="appointment-field">
        <label htmlFor="durationMinutes">Duração</label>
        <select
          id="durationMinutes"
          name="durationMinutes"
          defaultValue="30"
          required
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
        />
        <span>Escolha um horário futuro no seu fuso local.</span>
      </div>

      <div className="appointment-field">
        <label htmlFor="reasonText">Detalhes (opcional)</label>
        <textarea
          id="reasonText"
          name="reasonText"
          rows={4}
          maxLength={500}
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

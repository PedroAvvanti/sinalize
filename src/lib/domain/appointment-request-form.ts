import { isValidDuration } from "./appointments";

export type AppointmentRequestFieldErrors = {
  reason?: string;
  durationMinutes?: string;
  scheduledAt?: string;
};

export type AppointmentRequestFormInput = {
  reasonCode: string;
  customTitle: string;
  durationMinutes: number;
  scheduledAt: string;
};

export function validateAppointmentRequestForm(
  input: AppointmentRequestFormInput,
): AppointmentRequestFieldErrors {
  const errors: AppointmentRequestFieldErrors = {};

  if (!input.reasonCode) {
    errors.reason = "Selecione um motivo.";
  } else if (input.reasonCode === "outro" && !input.customTitle.trim()) {
    errors.reason = "Digite o motivo do atendimento.";
  }

  if (!isValidDuration(input.durationMinutes)) {
    errors.durationMinutes = "Informe a duração em minutos (mínimo 1).";
  }

  const parsedScheduledAt = new Date(input.scheduledAt);
  if (!input.scheduledAt || Number.isNaN(parsedScheduledAt.getTime())) {
    errors.scheduledAt = "Escolha uma data e hora válidas.";
  }

  return errors;
}

export function hasAppointmentRequestFieldErrors(
  errors: AppointmentRequestFieldErrors,
): boolean {
  return Boolean(errors.reason || errors.durationMinutes || errors.scheduledAt);
}

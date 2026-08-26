export type AppointmentRequestFieldErrors = {
  reason?: string;
  scheduledAt?: string;
};

export type AppointmentRequestFormInput = {
  reasonCode: string;
  customTitle: string;
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

  const parsedScheduledAt = new Date(input.scheduledAt);
  if (!input.scheduledAt || Number.isNaN(parsedScheduledAt.getTime())) {
    errors.scheduledAt = "Escolha uma data e hora válidas.";
  }

  return errors;
}

export function hasAppointmentRequestFieldErrors(
  errors: AppointmentRequestFieldErrors,
): boolean {
  return Boolean(errors.reason || errors.scheduledAt);
}

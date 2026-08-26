import type {
  AppointmentReasonCode,
  CancellationReasonCode,
} from "@/types/database";

export const REASON_TEXT_MAX_LENGTH = 500;
export const REASON_CUSTOM_TITLE_MAX_LENGTH = 120;

export const APPOINTMENT_REASONS = [
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "trabalho", label: "Trabalho" },
  { value: "servicos_publicos", label: "Serviços públicos" },
  { value: "comercio", label: "Comércio" },
  { value: "outro", label: "Outro" },
] as const satisfies ReadonlyArray<{
  value: AppointmentReasonCode;
  label: string;
}>;

/** Rótulo do select na solicitação (orientação para digitar). */
export function appointmentReasonFormLabel(
  reason: (typeof APPOINTMENT_REASONS)[number],
): string {
  return reason.value === "outro" ? "Outro (digite)" : reason.label;
}

export function appointmentReasonDisplayLabel(
  reasonCode: string,
  reasonCustomTitle?: string | null,
): string {
  const customTitle = reasonCustomTitle?.trim();
  if (reasonCode === "outro" && customTitle) {
    return customTitle;
  }

  return (
    APPOINTMENT_REASONS.find((reason) => reason.value === reasonCode)?.label ??
    "Outro"
  );
}

export const CANCEL_REASONS = [
  { value: "imprevisto", label: "Imprevisto" },
  { value: "doenca", label: "Doença" },
  { value: "conflito_horario", label: "Conflito de horário" },
  { value: "problema_tecnico", label: "Problema técnico" },
  { value: "outro", label: "Outro" },
] as const satisfies ReadonlyArray<{
  value: CancellationReasonCode;
  label: string;
}>;

export function isAppointmentReasonCode(
  value: string,
): value is AppointmentReasonCode {
  return APPOINTMENT_REASONS.some((reason) => reason.value === value);
}

export function isCancellationReasonCode(
  value: string,
): value is CancellationReasonCode {
  return CANCEL_REASONS.some((reason) => reason.value === value);
}

export type ValidateAppointmentReasonFieldsResult =
  | {
      ok: true;
      reasonCustomTitle: string | null;
      reasonText: string | null;
    }
  | { ok: false; error: string };

export function validateAppointmentReasonFields(input: {
  reasonCode: string;
  reasonCustomTitle?: string | null;
  reasonText?: string | null;
}): ValidateAppointmentReasonFieldsResult {
  const reasonText = input.reasonText?.trim() || null;
  const reasonCustomTitle =
    input.reasonCode === "outro"
      ? input.reasonCustomTitle?.trim() || null
      : null;

  if (input.reasonCode === "outro" && !reasonCustomTitle) {
    return {
      ok: false,
      error: "Digite o motivo do atendimento.",
    };
  }

  if (
    reasonCustomTitle &&
    reasonCustomTitle.length > REASON_CUSTOM_TITLE_MAX_LENGTH
  ) {
    return {
      ok: false,
      error: `O motivo deve ter no máximo ${REASON_CUSTOM_TITLE_MAX_LENGTH} caracteres.`,
    };
  }

  if (reasonText && reasonText.length > REASON_TEXT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Os detalhes devem ter no máximo ${REASON_TEXT_MAX_LENGTH} caracteres.`,
    };
  }

  return {
    ok: true,
    reasonCustomTitle,
    reasonText,
  };
}

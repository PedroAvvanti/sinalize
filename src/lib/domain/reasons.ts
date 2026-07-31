import type {
  AppointmentReasonCode,
  CancellationReasonCode,
} from "@/types/database";

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

export type InterpreterApplicationDecision = "approved" | "rejected";

export const REJECTION_REASON_MAX_LENGTH = 500;

/** Remove caracteres de controle; preserva newline e tab. */
export function sanitizeRejectionReason(raw: string): string {
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function assertRejectionReason(
  decision: InterpreterApplicationDecision,
  rejectionReason?: string,
): void {
  if (decision !== "rejected") {
    return;
  }

  const sanitized = sanitizeRejectionReason(rejectionReason ?? "").trim();

  if (!sanitized) {
    throw new Error("Informe o motivo da rejeição.");
  }

  if (sanitized.length > REJECTION_REASON_MAX_LENGTH) {
    throw new Error(
      `O motivo da rejeição deve ter no máximo ${REJECTION_REASON_MAX_LENGTH} caracteres.`,
    );
  }
}

/** Motivo persistido: rejeição exige texto; aprovação zera o motivo. */
export function rejectionReasonForDecision(
  decision: InterpreterApplicationDecision,
  rejectionReason?: string,
): string | null {
  assertRejectionReason(decision, rejectionReason);
  if (decision !== "rejected") {
    return null;
  }
  return sanitizeRejectionReason(rejectionReason!).trim();
}

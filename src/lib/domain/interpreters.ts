export type InterpreterApplicationDecision = "approved" | "rejected";

export function assertRejectionReason(
  decision: InterpreterApplicationDecision,
  rejectionReason?: string,
): void {
  if (decision === "rejected" && !rejectionReason?.trim()) {
    throw new Error("Informe o motivo da rejeição.");
  }
}

/** Motivo persistido: rejeição exige texto; aprovação zera o motivo. */
export function rejectionReasonForDecision(
  decision: InterpreterApplicationDecision,
  rejectionReason?: string,
): string | null {
  assertRejectionReason(decision, rejectionReason);
  return decision === "rejected" ? rejectionReason!.trim() : null;
}

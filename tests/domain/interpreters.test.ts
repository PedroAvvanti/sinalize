import { describe, expect, it } from "vitest";

import {
  assertRejectionReason,
  REJECTION_REASON_MAX_LENGTH,
  rejectionReasonForDecision,
  sanitizeRejectionReason,
} from "../../src/lib/domain/interpreters";

describe("assertRejectionReason", () => {
  it("exige motivo não vazio ao rejeitar", () => {
    expect(() => assertRejectionReason("rejected", "")).toThrow(
      "Informe o motivo da rejeição.",
    );
    expect(() => assertRejectionReason("rejected", "   ")).toThrow(
      "Informe o motivo da rejeição.",
    );
  });

  it("não exige motivo ao aprovar", () => {
    expect(() => assertRejectionReason("approved", "")).not.toThrow();
  });

  it("rejeita motivo acima do limite", () => {
    const tooLong = "a".repeat(REJECTION_REASON_MAX_LENGTH + 1);
    expect(() => assertRejectionReason("rejected", tooLong)).toThrow(
      `O motivo da rejeição deve ter no máximo ${REJECTION_REASON_MAX_LENGTH} caracteres.`,
    );
  });

  it("aceita motivo no limite máximo", () => {
    const atLimit = "a".repeat(REJECTION_REASON_MAX_LENGTH);
    expect(() => assertRejectionReason("rejected", atLimit)).not.toThrow();
  });
});

describe("sanitizeRejectionReason", () => {
  it("remove caracteres de controle e preserva newline", () => {
    expect(sanitizeRejectionReason("linha1\nlinha2\u0000\u0007fim")).toBe(
      "linha1\nlinha2fim",
    );
  });

  it("preserva tab", () => {
    expect(sanitizeRejectionReason("a\tb")).toBe("a\tb");
  });
});

describe("rejectionReasonForDecision", () => {
  it("persiste o motivo trimado na rejeição", () => {
    expect(
      rejectionReasonForDecision("rejected", "  documento ilegível  "),
    ).toBe("documento ilegível");
  });

  it("sanitiza controles antes de persistir", () => {
    expect(
      rejectionReasonForDecision("rejected", "  ilegível\u0000\nsegunda  "),
    ).toBe("ilegível\nsegunda");
  });

  it("zera o motivo na aprovação mesmo com texto residual", () => {
    expect(
      rejectionReasonForDecision("approved", "texto que não deve persistir"),
    ).toBeNull();
  });

  it("falha na rejeição sem motivo", () => {
    expect(() => rejectionReasonForDecision("rejected", "")).toThrow(
      "Informe o motivo da rejeição.",
    );
  });

  it("falha na rejeição só com controles", () => {
    expect(() =>
      rejectionReasonForDecision("rejected", "\u0000\u0007  "),
    ).toThrow("Informe o motivo da rejeição.");
  });
});

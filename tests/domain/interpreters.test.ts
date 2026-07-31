import { describe, expect, it } from "vitest";

import {
  assertRejectionReason,
  rejectionReasonForDecision,
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
});

describe("rejectionReasonForDecision", () => {
  it("persiste o motivo trimado na rejeição", () => {
    expect(
      rejectionReasonForDecision("rejected", "  documento ilegível  "),
    ).toBe("documento ilegível");
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
});

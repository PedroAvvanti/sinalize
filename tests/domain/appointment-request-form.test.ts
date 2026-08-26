import { describe, expect, it } from "vitest";

import {
  hasAppointmentRequestFieldErrors,
  validateAppointmentRequestForm,
} from "../../src/lib/domain/appointment-request-form";

describe("validateAppointmentRequestForm", () => {
  it("marca motivo e data quando ambos estão vazios", () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "",
        customTitle: "",
        scheduledAt: "",
      }),
    ).toEqual({
      reason: "Selecione um motivo.",
      scheduledAt: "Escolha uma data e hora válidas.",
    });
  });

  it('exige título digitado quando o motivo é "outro"', () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "outro",
        customTitle: "   ",
        scheduledAt: "2026-08-26T15:00",
      }),
    ).toEqual({
      reason: "Digite o motivo do atendimento.",
    });
  });

  it("não retorna erros com motivo e data válidos", () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "saude",
        customTitle: "",
        scheduledAt: "2026-08-26T15:00",
      }),
    ).toEqual({});
  });
});

describe("hasAppointmentRequestFieldErrors", () => {
  it("detecta se há algum erro de campo", () => {
    expect(hasAppointmentRequestFieldErrors({})).toBe(false);
    expect(
      hasAppointmentRequestFieldErrors({ reason: "Selecione um motivo." }),
    ).toBe(true);
  });
});

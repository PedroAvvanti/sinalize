import { describe, expect, it } from "vitest";

import {
  hasAppointmentRequestFieldErrors,
  validateAppointmentRequestForm,
} from "../../src/lib/domain/appointment-request-form";

describe("validateAppointmentRequestForm", () => {
  it("marca motivo, duração e data quando inválidos", () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "",
        customTitle: "",
        durationMinutes: 0,
        scheduledAt: "",
      }),
    ).toEqual({
      reason: "Selecione um motivo.",
      durationMinutes: "Informe a duração em minutos (mínimo 1).",
      scheduledAt: "Escolha uma data e hora válidas.",
    });
  });

  it('exige título digitado quando o motivo é "outro"', () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "outro",
        customTitle: "   ",
        durationMinutes: 30,
        scheduledAt: "2026-08-26T15:00",
      }),
    ).toEqual({
      reason: "Digite o motivo do atendimento.",
    });
  });

  it("rejeita duração não inteira ou negativa", () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "saude",
        customTitle: "",
        durationMinutes: 1.5,
        scheduledAt: "2026-08-26T15:00",
      }),
    ).toEqual({
      durationMinutes: "Informe a duração em minutos (mínimo 1).",
    });
  });

  it("não retorna erros com motivo, duração e data válidos", () => {
    expect(
      validateAppointmentRequestForm({
        reasonCode: "saude",
        customTitle: "",
        durationMinutes: 45,
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

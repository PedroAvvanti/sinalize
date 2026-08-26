import { describe, expect, it } from "vitest";

import {
  APPOINTMENT_REASONS,
  REASON_CUSTOM_TITLE_MAX_LENGTH,
  REASON_TEXT_MAX_LENGTH,
  appointmentReasonDisplayLabel,
  appointmentReasonFormLabel,
  validateAppointmentReasonFields,
} from "../../src/lib/domain/reasons";

describe("appointmentReasonFormLabel", () => {
  it('exibe "Outro (digite)" só no formulário de solicitação', () => {
    const outro = APPOINTMENT_REASONS.find((reason) => reason.value === "outro");
    const saude = APPOINTMENT_REASONS.find((reason) => reason.value === "saude");

    expect(outro).toBeDefined();
    expect(saude).toBeDefined();
    expect(appointmentReasonFormLabel(outro!)).toBe("Outro (digite)");
    expect(outro!.label).toBe("Outro");
    expect(appointmentReasonFormLabel(saude!)).toBe("Saúde");
  });
});

describe("appointmentReasonDisplayLabel", () => {
  it("usa o título digitado quando o motivo é outro", () => {
    expect(appointmentReasonDisplayLabel("outro", "Consulta no INSS")).toBe(
      "Consulta no INSS",
    );
  });

  it("usa o rótulo padrão nos demais motivos", () => {
    expect(appointmentReasonDisplayLabel("saude", null)).toBe("Saúde");
    expect(appointmentReasonDisplayLabel("outro", null)).toBe("Outro");
  });
});

describe("validateAppointmentReasonFields", () => {
  it('exige título quando o motivo é "outro"', () => {
    expect(
      validateAppointmentReasonFields({
        reasonCode: "outro",
        reasonCustomTitle: "",
        reasonText: "detalhe opcional",
      }),
    ).toEqual({
      ok: false,
      error: "Digite o motivo do atendimento.",
    });

    expect(
      validateAppointmentReasonFields({
        reasonCode: "outro",
        reasonCustomTitle: "   ",
      }),
    ).toEqual({
      ok: false,
      error: "Digite o motivo do atendimento.",
    });
  });

  it('aceita título trimado e detalhes opcionais quando o motivo é "outro"', () => {
    expect(
      validateAppointmentReasonFields({
        reasonCode: "outro",
        reasonCustomTitle: "  Consulta no INSS  ",
        reasonText: "  levar documentos  ",
      }),
    ).toEqual({
      ok: true,
      reasonCustomTitle: "Consulta no INSS",
      reasonText: "levar documentos",
    });

    expect(
      validateAppointmentReasonFields({
        reasonCode: "outro",
        reasonCustomTitle: "Consulta no INSS",
        reasonText: "",
      }),
    ).toEqual({
      ok: true,
      reasonCustomTitle: "Consulta no INSS",
      reasonText: null,
    });
  });

  it("ignora título custom nos demais motivos e mantém detalhes opcionais", () => {
    expect(
      validateAppointmentReasonFields({
        reasonCode: "saude",
        reasonCustomTitle: "não deve persistir",
        reasonText: "  exame  ",
      }),
    ).toEqual({
      ok: true,
      reasonCustomTitle: null,
      reasonText: "exame",
    });

    expect(
      validateAppointmentReasonFields({
        reasonCode: "saude",
        reasonText: "",
      }),
    ).toEqual({
      ok: true,
      reasonCustomTitle: null,
      reasonText: null,
    });
  });

  it("rejeita título ou detalhes acima do limite", () => {
    const tooLongTitle = "a".repeat(REASON_CUSTOM_TITLE_MAX_LENGTH + 1);
    const tooLongText = "a".repeat(REASON_TEXT_MAX_LENGTH + 1);

    expect(
      validateAppointmentReasonFields({
        reasonCode: "outro",
        reasonCustomTitle: tooLongTitle,
      }),
    ).toEqual({
      ok: false,
      error: `O motivo deve ter no máximo ${REASON_CUSTOM_TITLE_MAX_LENGTH} caracteres.`,
    });

    expect(
      validateAppointmentReasonFields({
        reasonCode: "saude",
        reasonText: tooLongText,
      }),
    ).toEqual({
      ok: false,
      error: `Os detalhes devem ter no máximo ${REASON_TEXT_MAX_LENGTH} caracteres.`,
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  formatCountdown,
  resolveCountdownState,
} from "../../src/lib/domain/countdown";
import { MEETING_EARLY_ACCESS_MINUTES } from "../../src/lib/domain/meeting-access";

describe("resolveCountdownState", () => {
  it("indica sala aberta dentro da janela", () => {
    const scheduledAt = new Date("2026-09-01T12:00:00");
    const now = new Date(scheduledAt.getTime() - 5 * 60 * 1000);

    expect(resolveCountdownState(scheduledAt, 30, now)).toEqual({
      kind: "live",
      label: "Sala aberta — você pode entrar agora",
    });
  });

  it("mostra lembrete 10 minutos antes do horário", () => {
    const scheduledAt = new Date("2026-09-01T12:00:00");
    const now = new Date(scheduledAt.getTime() - 8 * 60 * 1000);

    expect(resolveCountdownState(scheduledAt, 30, now).kind).toBe("reminder");
  });

  it("mostra contagem até abertura da sala", () => {
    const scheduledAt = new Date("2026-09-01T12:00:00");
    const now = new Date(
      scheduledAt.getTime() -
        (MEETING_EARLY_ACCESS_MINUTES + 20) * 60 * 1000,
    );

    expect(resolveCountdownState(scheduledAt, 30, now).kind).toBe("waiting");
  });
});

describe("formatCountdown", () => {
  it("formata minutos e segundos", () => {
    expect(formatCountdown(125_000)).toBe("2min 05s");
  });
});

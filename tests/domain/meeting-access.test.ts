import { describe, expect, it } from "vitest";

import {
  isUpcomingAppointment,
  isWithinMeetingWindow,
  MEETING_EARLY_ACCESS_MINUTES,
} from "../../src/lib/domain/meeting-access";
import { canEnterMeeting } from "../../src/lib/jitsi/meeting-access";

describe("meeting access", () => {
  it("allows entry ten minutes before start until duration ends", () => {
    const scheduled = new Date("2026-08-10T18:00:00.000Z");
    const early = new Date(scheduled.getTime() - MEETING_EARLY_ACCESS_MINUTES * 60 * 1000);
    const during = new Date("2026-08-10T18:15:00.000Z");
    const after = new Date("2026-08-10T19:01:00.000Z");

    expect(isWithinMeetingWindow(scheduled, 60, early)).toBe(true);
    expect(isWithinMeetingWindow(scheduled, 60, during)).toBe(true);
    expect(isWithinMeetingWindow(scheduled, 60, after)).toBe(false);
  });

  it("marks appointments as upcoming until they end", () => {
    const scheduled = new Date("2026-08-10T18:00:00.000Z");
    const beforeEnd = new Date("2026-08-10T18:45:00.000Z");
    const afterEnd = new Date("2026-08-10T19:01:00.000Z");

    expect(isUpcomingAppointment(scheduled, 60, beforeEnd)).toBe(true);
    expect(isUpcomingAppointment(scheduled, 60, afterEnd)).toBe(false);
  });
});

describe("canEnterMeeting", () => {
  const scheduled = new Date("2026-08-10T18:00:00.000Z");
  const during = new Date("2026-08-10T18:15:00.000Z");

  const baseAppointment = {
    requesterId: "user-1",
    interpreterId: "interp-1",
    status: "accepted" as const,
    scheduledAt: scheduled,
    durationMinutes: 60,
  };

  it("allows participants inside the meeting window", () => {
    expect(
      canEnterMeeting({
        appointment: baseAppointment,
        userId: "user-1",
        now: during,
      }),
    ).toEqual({ ok: true });
  });

  it("blocks non-participants", () => {
    expect(
      canEnterMeeting({
        appointment: baseAppointment,
        userId: "other-user",
        now: during,
      }),
    ).toEqual({
      ok: false,
      reason: "Você não participa deste atendimento.",
    });
  });

  it("blocks open appointments", () => {
    expect(
      canEnterMeeting({
        appointment: { ...baseAppointment, status: "open" },
        userId: "user-1",
        now: during,
      }),
    ).toEqual({
      ok: false,
      reason: "Este atendimento ainda não está disponível para videochamada.",
    });
  });

  it("blocks outside the meeting window", () => {
    expect(
      canEnterMeeting({
        appointment: baseAppointment,
        userId: "user-1",
        now: new Date("2026-08-10T12:00:00.000Z"),
      }),
    ).toEqual({
      ok: false,
      reason: `A sala abre ${MEETING_EARLY_ACCESS_MINUTES} minutos antes do horário agendado e encerra ao fim da duração.`,
    });
  });
});

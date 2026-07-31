import { describe, expect, it } from "vitest";

import {
  canUserCancelDirectly,
  nextAppointmentStatusAfterCancellationDecision,
} from "../../src/lib/domain/cancellations";

describe("canUserCancelDirectly", () => {
  it("allows before the calendar day", () => {
    const scheduled = new Date("2026-08-10T18:00:00-03:00");
    const now = new Date("2026-08-09T23:00:00-03:00");
    expect(canUserCancelDirectly(scheduled, now)).toBe(true);
  });

  it("blocks on the same calendar day", () => {
    const scheduled = new Date("2026-08-10T18:00:00-03:00");
    const now = new Date("2026-08-10T09:00:00-03:00");
    expect(canUserCancelDirectly(scheduled, now)).toBe(false);
  });

  it("blocks after the calendar day", () => {
    const scheduled = new Date("2026-08-10T18:00:00-03:00");
    const now = new Date("2026-08-11T08:00:00-03:00");
    expect(canUserCancelDirectly(scheduled, now)).toBe(false);
  });
});

describe("nextAppointmentStatusAfterCancellationDecision", () => {
  it("reopens the queue when an interpreter cancellation is approved", () => {
    expect(
      nextAppointmentStatusAfterCancellationDecision("approved", "interpreter"),
    ).toEqual({ status: "open", clearInterpreter: true });
  });

  it("cancels the appointment when a user cancellation is approved", () => {
    expect(
      nextAppointmentStatusAfterCancellationDecision("approved", "user"),
    ).toEqual({ status: "cancelled", clearInterpreter: false });
  });

  it("restores accepted when the admin rejects the request", () => {
    expect(
      nextAppointmentStatusAfterCancellationDecision("rejected", "user"),
    ).toEqual({ status: "accepted", clearInterpreter: false });
  });
});

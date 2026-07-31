import { describe, expect, it } from "vitest";

import {
  isUpcomingAppointment,
  isWithinMeetingWindow,
  MEETING_EARLY_ACCESS_MINUTES,
} from "../../src/lib/domain/meeting-access";

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

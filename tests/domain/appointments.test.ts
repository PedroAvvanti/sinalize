import { describe, expect, it } from "vitest";

import {
  buildJitsiRoomName,
  isValidDuration,
  parseScheduledAtIso,
} from "../../src/lib/domain/appointments";

describe("appointments domain", () => {
  it("allows only 15/30/60", () => {
    expect(isValidDuration(15)).toBe(true);
    expect(isValidDuration(20)).toBe(false);
  });

  it("builds stable room names", () => {
    expect(buildJitsiRoomName("abc")).toMatch(/^sinalize-abc$/);
  });

  it.each([
    ["2026-07-31T13:30:00.000Z", "2026-07-31T13:30:00.000Z"],
    ["2026-07-31T10:30:00-03:00", "2026-07-31T13:30:00.000Z"],
  ])("parses canonical ISO datetimes with timezone: %s", (input, expected) => {
    expect(parseScheduledAtIso(input)?.toISOString()).toBe(expected);
  });

  it.each([
    "2026-07-31",
    "2026-07-31T13:30",
    "2026-07-31T13:30:00",
    "07/31/2026 13:30:00",
    "2026-02-30T13:30:00.000Z",
  ])("rejects ambiguous or invalid datetime: %s", (input) => {
    expect(parseScheduledAtIso(input)).toBeNull();
  });
});

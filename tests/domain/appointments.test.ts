import { describe, expect, it } from "vitest";

import {
  buildJitsiRoomName,
  isValidDuration,
} from "../../src/lib/domain/appointments";

describe("appointments domain", () => {
  it("allows only 15/30/60", () => {
    expect(isValidDuration(15)).toBe(true);
    expect(isValidDuration(20)).toBe(false);
  });

  it("builds stable room names", () => {
    expect(buildJitsiRoomName("abc")).toMatch(/^sinalize-abc$/);
  });
});

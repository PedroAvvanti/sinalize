import { describe, expect, it } from "vitest";

import {
  canMarkAppointmentCompleted,
  resolveLeaveMeetingIntent,
} from "../../src/lib/domain/meeting-leave";

describe("meeting leave", () => {
  it("sends the deaf requester to review and completes the call", () => {
    expect(resolveLeaveMeetingIntent("user", "appt-1")).toEqual({
      shouldComplete: true,
      redirectTo: "/app/review/appt-1",
    });
  });

  it("sends the interpreter home without completing", () => {
    expect(resolveLeaveMeetingIntent("interpreter", "appt-1")).toEqual({
      shouldComplete: false,
      redirectTo: "/app/interpreter",
    });
  });

  it("allows completing accepted appointments and treats completed as already done", () => {
    expect(canMarkAppointmentCompleted("accepted")).toBe("ok");
    expect(canMarkAppointmentCompleted("completed")).toBe("already_done");
    expect(canMarkAppointmentCompleted("cancel_requested")).toBe("blocked");
    expect(canMarkAppointmentCompleted("open")).toBe("blocked");
  });
});

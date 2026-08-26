import { describe, expect, it } from "vitest";

import {
  appointmentBecameAccepted,
  pickNextCall,
} from "../../src/lib/domain/user-home";

const base = {
  duration_minutes: 30 as const,
  reason_code: "trabalho",
  reason_custom_title: null,
  reason_text: null,
};

describe("pickNextCall", () => {
  const now = new Date("2026-08-26T15:00:00.000Z");

  it("returns null when there is no upcoming appointment", () => {
    expect(
      pickNextCall(
        [
          {
            id: "past",
            status: "open",
            scheduled_at: "2026-08-26T12:00:00.000Z",
            ...base,
          },
        ],
        now,
      ),
    ).toBeNull();
  });

  it("prefers confirmed upcoming over open", () => {
    const next = pickNextCall(
      [
        {
          id: "open-soon",
          status: "open",
          scheduled_at: "2026-08-26T16:00:00.000Z",
          ...base,
        },
        {
          id: "accepted-later",
          status: "accepted",
          scheduled_at: "2026-08-26T18:00:00.000Z",
          ...base,
        },
      ],
      now,
    );

    expect(next?.id).toBe("accepted-later");
  });

  it("falls back to the soonest open appointment", () => {
    const next = pickNextCall(
      [
        {
          id: "later",
          status: "open",
          scheduled_at: "2026-08-26T19:00:00.000Z",
          ...base,
        },
        {
          id: "sooner",
          status: "open",
          scheduled_at: "2026-08-26T16:00:00.000Z",
          ...base,
        },
      ],
      now,
    );

    expect(next?.id).toBe("sooner");
  });
});

describe("appointmentBecameAccepted", () => {
  it("detects open → accepted transition", () => {
    expect(
      appointmentBecameAccepted(
        [{ id: "a", status: "open" }],
        [{ id: "a", status: "accepted" }],
      ),
    ).toBe(true);
  });

  it("ignores appointments that were already accepted", () => {
    expect(
      appointmentBecameAccepted(
        [{ id: "a", status: "accepted" }],
        [{ id: "a", status: "accepted" }],
      ),
    ).toBe(false);
  });

  it("ignores unrelated status changes", () => {
    expect(
      appointmentBecameAccepted(
        [{ id: "a", status: "open" }],
        [{ id: "a", status: "cancelled" }],
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { resolveNotificationHref } from "../../src/lib/domain/notifications";

describe("resolveNotificationHref", () => {
  it("leva ao meeting quando o pedido foi aceito", () => {
    expect(
      resolveNotificationHref(
        "appointment_accepted",
        "abc-123",
        "user",
      ),
    ).toBe("/app/meeting/abc-123");
  });

  it("leva à avaliação após conclusão", () => {
    expect(
      resolveNotificationHref(
        "appointment_completed",
        "abc-123",
        "user",
      ),
    ).toBe("/app/review/abc-123");
  });

  it("leva ao admin de cancelamentos sem appointment id", () => {
    expect(
      resolveNotificationHref("cancellation_pending", null, "admin"),
    ).toBe("/app/admin/cancellations");
  });
});

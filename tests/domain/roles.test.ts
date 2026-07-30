import { describe, expect, it } from "vitest";

import { homePathForRole } from "../../src/lib/auth/roles";

describe("homePathForRole", () => {
  it("direciona cada papel para sua área", () => {
    expect(homePathForRole("user")).toBe("/app/user");
    expect(homePathForRole("interpreter")).toBe("/app/interpreter");
    expect(homePathForRole("admin")).toBe("/app/admin");
  });
});

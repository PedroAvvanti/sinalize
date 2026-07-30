import { describe, expect, it } from "vitest";

import {
  isThemePreference,
  normalizeThemePreference,
  resolveThemeUpdate,
} from "../../src/lib/theme";

describe("isThemePreference", () => {
  it.each(["light", "dark"])("aceita o tema persistível %s", (theme) => {
    expect(isThemePreference(theme)).toBe(true);
  });

  it.each([null, undefined, "", "system", "DARK", 1])(
    "rejeita o tema inválido %s",
    (theme) => {
      expect(isThemePreference(theme)).toBe(false);
    },
  );
});

describe("normalizeThemePreference", () => {
  it("preserva preferências válidas", () => {
    expect(normalizeThemePreference("light")).toBe("light");
    expect(normalizeThemePreference("dark")).toBe("dark");
  });

  it.each([null, undefined, "", "system", "DARK", 1])(
    "usa light como fallback público para %s",
    (theme) => {
      expect(normalizeThemePreference(theme)).toBe("light");
    },
  );
});

describe("resolveThemeUpdate", () => {
  it("reverte o tema e informa erro quando a persistência rejeita", async () => {
    const result = await resolveThemeUpdate("light", "dark", async () => {
      throw new Error("network unavailable");
    });

    expect(result).toEqual({
      theme: "light",
      error: "Não foi possível salvar o tema. Tente novamente.",
    });
  });
});

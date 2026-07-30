import type { ThemePreference } from "@/types/database";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function normalizeThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : "light";
}

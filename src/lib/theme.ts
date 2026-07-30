import type { ThemePreference } from "@/types/database";

type ThemePersistenceResult =
  | { ok: true; theme: ThemePreference }
  | { ok: false; error: string };

type ThemeUpdateDecision = {
  theme: ThemePreference;
  error: string | null;
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function normalizeThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : "light";
}

export async function resolveThemeUpdate(
  previousTheme: ThemePreference,
  nextTheme: ThemePreference,
  save: (theme: ThemePreference) => Promise<ThemePersistenceResult>,
): Promise<ThemeUpdateDecision> {
  try {
    const result = await save(nextTheme);

    if (!result.ok) {
      return { theme: previousTheme, error: result.error };
    }

    return { theme: result.theme, error: null };
  } catch {
    return {
      theme: previousTheme,
      error: "Não foi possível salvar o tema. Tente novamente.",
    };
  }
}

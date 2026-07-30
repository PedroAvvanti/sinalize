"use client";

import { useId, useState, useTransition } from "react";

import { updateThemePreference } from "@/actions/profile";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const errorId = useId();
  const isDark = theme === "dark";

  function toggleTheme() {
    const previousTheme = theme;
    const nextTheme = isDark ? "light" : "dark";

    setError(null);
    setTheme(nextTheme);

    startTransition(async () => {
      const result = await updateThemePreference(nextTheme);

      if (!result.ok) {
        setTheme(previousTheme);
        setError(result.error);
        return;
      }

      setTheme(result.theme);
    });
  }

  return (
    <div className="theme-control">
      <button
        aria-checked={isDark}
        aria-describedby={error ? errorId : undefined}
        className="theme-toggle"
        disabled={isPending}
        onClick={toggleTheme}
        role="switch"
        type="button"
      >
        <span className="theme-toggle-copy">
          <span>Tema escuro</span>
          <span>{isPending ? "Salvando…" : isDark ? "Ativado" : "Desativado"}</span>
        </span>
        <span aria-hidden="true" className="theme-toggle-track">
          <span className="theme-toggle-signal">
            {isDark ? (
              <svg viewBox="0 0 24 24">
                <path d="M20.2 15.1A8 8 0 0 1 8.9 3.8 8.1 8.1 0 1 0 20.2 15.1Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3.5" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
          </span>
        </span>
      </button>
      {error ? (
        <p className="theme-toggle-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

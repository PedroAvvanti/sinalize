"use server";

import { isThemePreference } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreference } from "@/types/database";

export type ThemeActionResult =
  | { ok: true; theme: ThemePreference }
  | { ok: false; error: string };

export async function updateThemePreference(
  theme: ThemePreference,
): Promise<ThemeActionResult> {
  if (!isThemePreference(theme)) {
    return { ok: false, error: "Escolha um tema válido." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      ok: false,
      error: "Sua sessão expirou. Entre novamente para salvar o tema.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ theme_preference: theme })
    .eq("id", userId)
    .select("theme_preference")
    .single();

  if (error || !profile) {
    console.error("Não foi possível atualizar a preferência de tema.", {
      code: error?.code,
    });
    return {
      ok: false,
      error: "Não foi possível salvar o tema. Tente novamente.",
    };
  }

  return { ok: true, theme: profile.theme_preference };
}

"use server";

import { revalidatePath } from "next/cache";

import { isThemePreference } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreference } from "@/types/database";

const FULL_NAME_MAX_LENGTH = 120;

export type ThemeActionResult =
  | { ok: true; theme: ThemePreference }
  | { ok: false; error: string };

export type UpdateProfileInput = {
  fullName: string;
};

export type UpdateProfileResult =
  | { ok: true }
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

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const fullName = input.fullName.trim();

  if (!fullName) {
    return { ok: false, error: "Informe seu nome completo." };
  }

  if (fullName.length > FULL_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `O nome deve ter no máximo ${FULL_NAME_MAX_LENGTH} caracteres.`,
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      ok: false,
      error: "Sua sessão expirou. Entre novamente para salvar o perfil.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) {
    console.error("Não foi possível atualizar o perfil.", { code: error.code });
    return {
      ok: false,
      error: "Não foi possível salvar o perfil. Tente novamente.",
    };
  }

  revalidatePath("/app/user/profile");
  revalidatePath("/app/interpreter");
  revalidatePath("/app/admin");
  return { ok: true };
}

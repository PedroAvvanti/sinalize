"use server";

import { redirect } from "next/navigation";

import { authMessageFor, resolvePostLoginPath } from "@/lib/auth/policy";
import type { ProfileRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  fieldErrors?: {
    password?: string;
    password_confirm?: string;
  };
  values?: {
    full_name?: string;
    email?: string;
    password?: string;
    password_confirm?: string;
    role?: string;
  };
  /** Remonta o formulário após erro da action para reaplicar defaultValue. */
  resetKey?: string;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function mirrorRoleInAppMetadata(userId: string, role: ProfileRole) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });

    if (error) {
      console.error("Não foi possível espelhar o papel em app_metadata.", error);
    }
  } catch (error) {
    console.error("Não foi possível espelhar o papel em app_metadata.", error);
  }
}

/** Espelha o papel após signUp no browser (PKCE precisa do code_verifier no client). */
export async function finalizeSignupRoleAction(
  userId: string,
  role: ProfileRole,
) {
  if (role !== "user" && role !== "interpreter") {
    return;
  }

  await mirrorRoleInAppMetadata(userId, role);
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const nextPath = value(formData, "next");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: authMessageFor("profile_unavailable") };
  }

  redirect(resolvePostLoginPath(nextPath, profile.role));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

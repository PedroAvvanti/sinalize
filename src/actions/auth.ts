"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authMessageFor, resolvePostLoginPath } from "@/lib/auth/policy";
import { validatePasswordLength } from "@/lib/auth/password";
import type { ProfileRole } from "@/lib/auth/roles";
import {
  checkRateLimit,
  rateLimitErrorMessage,
} from "@/lib/rate-limit";
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
  success?: string;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function rateLimitKey(scope: string, userId?: string) {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  return userId ? `${scope}:${userId}` : `${scope}:${ip}`;
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

export async function assertSignupRateLimitAction(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = await rateLimitKey("signup", email.toLowerCase());
  const result = checkRateLimit(key, 5, 15 * 60 * 1000);

  if (!result.ok) {
    return { ok: false, error: rateLimitErrorMessage(result.retryAfterSeconds) };
  }

  return { ok: true };
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

  const loginLimit = checkRateLimit(
    await rateLimitKey("signin", email.toLowerCase()),
    10,
    15 * 60 * 1000,
  );

  if (!loginLimit.ok) {
    return { error: rateLimitErrorMessage(loginLimit.retryAfterSeconds) };
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

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = value(formData, "email");

  if (!email) {
    return { error: "Informe seu e-mail." };
  }

  const limit = checkRateLimit(
    await rateLimitKey("password-reset", email.toLowerCase()),
    3,
    60 * 60 * 1000,
  );

  if (!limit.ok) {
    return { error: rateLimitErrorMessage(limit.retryAfterSeconds) };
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("Falha ao solicitar redefinição de senha.", {
      code: error.code,
    });
  }

  return {
    success:
      "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = value(formData, "password");
  const passwordConfirm = value(formData, "password_confirm");

  if (!password || !passwordConfirm) {
    return { error: "Informe e confirme a nova senha." };
  }

  const lengthCheck = validatePasswordLength(password);
  if (!lengthCheck.ok) {
    return { error: lengthCheck.error };
  }

  if (password !== passwordConfirm) {
    return { error: authMessageFor("password_mismatch") };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      error: "Sua sessão expirou. Solicite um novo link de redefinição.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Não foi possível atualizar a senha. Tente novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role) {
    redirect(resolvePostLoginPath("", profile.role));
  }

  redirect("/login");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  authMessageFor,
  resolvePostLoginPath,
  validatePasswordConfirmation,
  validateSignupEligibility,
} from "@/lib/auth/policy";
import { homePathForRole, type ProfileRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function appOrigin() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}

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

function signupValues(
  fullName: string,
  email: string,
  password: string,
  passwordConfirm: string,
  role: string,
): NonNullable<AuthActionState["values"]> {
  return {
    full_name: fullName,
    email,
    password,
    password_confirm: passwordConfirm,
    role,
  };
}

function errorState(
  values: NonNullable<AuthActionState["values"]>,
  payload: Pick<AuthActionState, "error" | "fieldErrors">,
): AuthActionState {
  return {
    ...payload,
    values,
    resetKey: `${Date.now()}`,
  };
}

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

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = value(formData, "full_name");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const passwordConfirm = value(formData, "password_confirm");
  const requestedRole = value(formData, "role");
  const adult = formData.get("is_adult") === "on";
  const values = signupValues(
    fullName,
    email,
    password,
    passwordConfirm,
    requestedRole,
  );
  const eligibility = validateSignupEligibility(requestedRole, adult);

  if (!eligibility.ok) {
    return errorState(values, { error: eligibility.error });
  }

  const { role } = eligibility;

  if (!fullName || !email || !password) {
    return errorState(values, { error: "Preencha nome, e-mail e senha." });
  }

  if (password.length < 6) {
    return errorState(values, {
      fieldErrors: { password: authMessageFor("password_too_short") },
    });
  }

  const confirmation = validatePasswordConfirmation(password, passwordConfirm);
  if (!confirmation.ok) {
    return errorState(values, {
      fieldErrors: { password_confirm: confirmation.error },
    });
  }

  const supabase = await createClient();
  const emailRedirectTo = `${await appOrigin()}/auth/callback`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    console.error("Falha no cadastro pelo provedor de autenticação.", {
      code: error.code,
      status: error.status,
    });
    return errorState(values, { error: authMessageFor("signup_failed") });
  }

  // Em confirmação de e-mail, cadastro repetido pode devolver um usuário
  // ofuscado sem identities. Nunca alteramos metadata nesse caso.
  if (data.user?.identities?.length) {
    await mirrorRoleInAppMetadata(data.user.id, role);
  }

  if (data.session && data.user) {
    redirect(homePathForRole(role));
  }

  redirect("/confirm");
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

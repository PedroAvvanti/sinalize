"use server";

import { redirect } from "next/navigation";

import {
  authMessageFor,
  resolvePostLoginPath,
  validateSignupEligibility,
} from "@/lib/auth/policy";
import { homePathForRole, type ProfileRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
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

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = value(formData, "full_name");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const requestedRole = value(formData, "role");
  const adult = formData.get("is_adult") === "on";
  const eligibility = validateSignupEligibility(requestedRole, adult);

  if (!eligibility.ok) {
    return { error: eligibility.error };
  }

  const { role } = eligibility;

  if (!fullName || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
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
    return { error: authMessageFor("signup_failed") };
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

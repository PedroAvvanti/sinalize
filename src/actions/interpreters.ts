"use server";

import { revalidatePath } from "next/cache";

import {
  buildCertificatePath,
  isActiveApplicationConflict,
  validateCertificate,
} from "@/lib/interpreters/application";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InterpreterApplicationActionState = {
  error?: string;
  submitted?: boolean;
};

export async function submitInterpreterApplication(
  _previousState: InterpreterApplicationActionState,
  formData: FormData,
): Promise<InterpreterApplicationActionState> {
  const certificate = formData.get("certificate");

  if (!(certificate instanceof File)) {
    return { error: "Escolha um certificado para enviar." };
  }

  const start = new Uint8Array(
    await certificate.slice(0, 12).arrayBuffer(),
  );
  const end = new Uint8Array(
    await certificate
      .slice(Math.max(0, certificate.size - 64), certificate.size)
      .arrayBuffer(),
  );
  const validation = validateCertificate({
    name: certificate.name,
    type: certificate.type,
    size: certificate.size,
    start,
    end,
  });

  if (!validation.ok) {
    return { error: validation.error };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      error: "Sua sessão expirou. Entre novamente para enviar o certificado.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || profile?.role !== "interpreter") {
    return {
      error: "Apenas contas de intérprete podem enviar certificados.",
    };
  }

  const { data: activeApplication, error: applicationLookupError } =
    await supabase
      .from("interpreter_applications")
      .select("status")
      .eq("profile_id", userId)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (applicationLookupError) {
    console.error("Não foi possível consultar a candidatura do intérprete.", {
      code: applicationLookupError.code,
    });
    return {
      error: "Não foi possível verificar sua candidatura. Tente novamente.",
    };
  }

  if (activeApplication) {
    revalidatePath("/app/interpreter/onboarding");
    return { submitted: true };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY não está configurada.");
    return {
      error: "Não foi possível processar o envio. Tente novamente mais tarde.",
    };
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch {
    console.error("Não foi possível inicializar o client administrativo.");
    return {
      error: "Não foi possível processar o envio. Tente novamente mais tarde.",
    };
  }

  const certificatePath = buildCertificatePath(
    userId,
    crypto.randomUUID(),
    validation.extension,
  );
  const { error: uploadError } = await admin.storage
    .from("certificates")
    .upload(certificatePath, certificate, {
      contentType: validation.contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Não foi possível armazenar o certificado.", uploadError);
    return {
      error: "Não foi possível enviar o certificado. Tente novamente.",
    };
  }

  const { error: insertError } = await admin
    .from("interpreter_applications")
    .insert({
      profile_id: userId,
      certificate_path: certificatePath,
      status: "pending",
    });

  if (insertError) {
    const { error: cleanupError } = await admin.storage
      .from("certificates")
      .remove([certificatePath]);

    console.error("Não foi possível registrar a candidatura.", {
      code: insertError.code,
      cleanupCode: cleanupError?.statusCode,
    });

    if (isActiveApplicationConflict(insertError)) {
      revalidatePath("/app/interpreter/onboarding");
      return { submitted: true };
    }

    return {
      error:
        "O certificado não foi registrado. Tente novamente antes de reenviar.",
    };
  }

  revalidatePath("/app/interpreter");
  revalidatePath("/app/interpreter/onboarding");
  return { submitted: true };
}

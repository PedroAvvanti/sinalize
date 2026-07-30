"use server";

import { revalidatePath } from "next/cache";

import {
  buildCertificatePath,
  validateCertificate,
} from "@/lib/interpreters/application";
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

  const header = new Uint8Array(
    await certificate.slice(0, 12).arrayBuffer(),
  );
  const validation = validateCertificate({
    name: certificate.name,
    type: certificate.type,
    size: certificate.size,
    header,
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

  // Sem uma restrição única parcial no schema, esta consulta torna reenvios
  // sequenciais idempotentes. Requisições realmente simultâneas ainda
  // dependem de uma futura garantia transacional no banco.
  const { data: activeApplication, error: applicationLookupError } =
    await supabase
      .from("interpreter_applications")
      .select("status")
      .eq("profile_id", userId)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
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

  const certificatePath = buildCertificatePath(
    userId,
    crypto.randomUUID(),
    validation.extension,
  );
  const { error: uploadError } = await supabase.storage
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

  const { error: insertError } = await supabase
    .from("interpreter_applications")
    .insert({
      profile_id: userId,
      certificate_path: certificatePath,
      status: "pending",
    });

  if (insertError) {
    const { error: cleanupError } = await supabase.storage
      .from("certificates")
      .remove([certificatePath]);

    console.error("Não foi possível registrar a candidatura.", {
      code: insertError.code,
      cleanupCode: cleanupError?.statusCode,
    });
    return {
      error:
        "O certificado não foi registrado. Tente novamente antes de reenviar.",
    };
  }

  revalidatePath("/app/interpreter");
  revalidatePath("/app/interpreter/onboarding");
  return { submitted: true };
}

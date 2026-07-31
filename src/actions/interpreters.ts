"use server";

import { revalidatePath } from "next/cache";

import {
  buildCertificatePath,
  canReturnIdempotentApplicationSuccess,
  validateCertificate,
} from "@/lib/interpreters/application";
import {
  rejectionReasonForDecision,
  type InterpreterApplicationDecision,
} from "@/lib/domain/interpreters";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InterpreterApplicationActionState = {
  error?: string;
  submitted?: boolean;
};

export type ReviewInterpreterApplicationResult = {
  error?: string;
  reviewed?: boolean;
};

type ReviewInterpreterApplicationInput = {
  id: string;
  decision: InterpreterApplicationDecision;
  rejectionReason?: string;
};

export async function reviewInterpreterApplication({
  id,
  decision,
  rejectionReason,
}: ReviewInterpreterApplicationInput): Promise<ReviewInterpreterApplicationResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const adminId = claimsData?.claims.sub;

  if (!adminId) {
    return { error: "Sua sessão expirou. Entre novamente para continuar." };
  }

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", adminId)
    .single();

  if (adminProfileError || adminProfile?.role !== "admin") {
    return { error: "Apenas administradores podem revisar candidaturas." };
  }

  if (!id || (decision !== "approved" && decision !== "rejected")) {
    return { error: "A decisão informada é inválida." };
  }

  let normalizedReason: string | null;

  try {
    normalizedReason = rejectionReasonForDecision(decision, rejectionReason);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Informe o motivo da rejeição.",
    };
  }

  const reviewedAt = new Date().toISOString();
  const { data: application, error: reviewError } = await supabase
    .from("interpreter_applications")
    .update({
      status: decision,
      reviewed_by: adminId,
      reviewed_at: reviewedAt,
      rejection_reason: normalizedReason,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("profile_id")
    .maybeSingle();

  if (reviewError || !application) {
    console.error("Não foi possível revisar a candidatura.", {
      code: reviewError?.code,
      applicationId: id,
    });
    return {
      error:
        "A candidatura não está mais pendente ou não pôde ser atualizada.",
    };
  }

  const notification =
    decision === "approved"
      ? {
          profile_id: application.profile_id,
          type: "interpreter_application_approved",
          title: "Candidatura aprovada",
          body: "Seu certificado foi aprovado. A área do intérprete já está liberada.",
        }
      : {
          profile_id: application.profile_id,
          type: "interpreter_application_rejected",
          title: "Candidatura precisa de ajustes",
          body: `Seu certificado não foi aprovado. Motivo: ${normalizedReason}`,
        };
  const { error: notificationError } = await supabase
    .from("notifications")
    .insert(notification);

  if (notificationError) {
    const { data: rolledBack, error: rollbackError } = await supabase
      .from("interpreter_applications")
      .update({
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
      })
      .eq("id", id)
      .eq("status", decision)
      .eq("reviewed_by", adminId)
      .eq("reviewed_at", reviewedAt)
      .select("id")
      .maybeSingle();

    const rollbackFailed = Boolean(rollbackError) || !rolledBack;

    console.error("Não foi possível notificar o intérprete após a revisão.", {
      code: notificationError.code,
      rollbackCode: rollbackError?.code,
      rollbackMatched: Boolean(rolledBack),
      applicationId: id,
    });
    return {
      error: rollbackFailed
        ? "A decisão foi registrada, mas a notificação falhou. Recarregue a fila."
        : "A decisão não foi salva porque a notificação falhou. Tente novamente.",
    };
  }

  revalidatePath("/app/admin");
  revalidatePath("/app/admin/interpreters");
  revalidatePath("/app/interpreter");
  revalidatePath("/app/interpreter/onboarding");
  return { reviewed: true };
}

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

    if (
      canReturnIdempotentApplicationSuccess(insertError, cleanupError)
    ) {
      revalidatePath("/app/interpreter/onboarding");
      return { submitted: true };
    }

    if (insertError.code === "23505" && cleanupError) {
      return {
        error: "Não foi possível concluir o envio. Tente novamente.",
      };
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

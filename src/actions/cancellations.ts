"use server";

import { revalidatePath } from "next/cache";

import {
  canUserCancelDirectly,
  cancelRequestMessage,
  directCancelMessage,
} from "@/lib/domain/cancellations";
import { isCancellationReasonCode } from "@/lib/domain/reasons";
import { createClient } from "@/lib/supabase/server";

const REASON_TEXT_MAX_LENGTH = 500;

export type RequestOrCancelAppointmentInput = {
  appointmentId: string;
  reasonCode: string;
  reasonText?: string;
};

export type RequestOrCancelAppointmentResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function mapCancellationError(error: { message?: string } | null): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("not authenticated")) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (message.includes("not a participant")) {
    return "Você não participa deste atendimento.";
  }
  if (message.includes("not assigned interpreter")) {
    return "Apenas o intérprete designado pode solicitar cancelamento.";
  }
  if (message.includes("cannot be cancelled")) {
    return "Este atendimento não pode ser cancelado agora.";
  }
  if (message.includes("cancellation already pending")) {
    return "Já existe um cancelamento em análise para este atendimento.";
  }
  if (message.includes("only participants")) {
    return "Apenas participantes podem cancelar atendimentos.";
  }

  return "Não foi possível processar o cancelamento. Tente novamente.";
}

export async function requestOrCancelAppointmentAction(
  input: RequestOrCancelAppointmentInput,
): Promise<RequestOrCancelAppointmentResult> {
  const reasonText = input.reasonText?.trim() || null;

  if (!input.appointmentId || !isCancellationReasonCode(input.reasonCode)) {
    return { ok: false, error: "Informe um motivo válido para o cancelamento." };
  }

  if (reasonText && reasonText.length > REASON_TEXT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Os detalhes devem ter no máximo ${REASON_TEXT_MAX_LENGTH} caracteres.`,
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      ok: false,
      error: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile || profile.role === "admin") {
    return { ok: false, error: "Sua conta não pode cancelar atendimentos." };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, requester_id, interpreter_id, status, scheduled_at")
    .eq("id", input.appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return { ok: false, error: "Atendimento não encontrado." };
  }

  const isParticipant =
    appointment.requester_id === userId ||
    appointment.interpreter_id === userId;

  if (!isParticipant) {
    return { ok: false, error: "Você não participa deste atendimento." };
  }

  if (appointment.status !== "open" && appointment.status !== "accepted") {
    return { ok: false, error: "Este atendimento não pode ser cancelado agora." };
  }

  const scheduledAt = new Date(appointment.scheduled_at);
  const willCancelDirectly =
    profile.role === "user" &&
    appointment.requester_id === userId &&
    canUserCancelDirectly(scheduledAt);

  const { data: updated, error: rpcError } = await supabase.rpc(
    "request_or_cancel_appointment",
    {
      p_appointment_id: input.appointmentId,
      p_reason_code: input.reasonCode,
      p_reason_text: reasonText,
    },
  );

  if (rpcError || !updated) {
    console.error("Não foi possível cancelar o atendimento.", {
      code: rpcError?.code,
      appointmentId: input.appointmentId,
    });
    return { ok: false, error: mapCancellationError(rpcError) };
  }

  revalidatePath("/app/user");
  revalidatePath("/app/interpreter");
  revalidatePath("/app/admin");

  return {
    ok: true,
    message: willCancelDirectly
      ? directCancelMessage()
      : cancelRequestMessage(),
  };
}

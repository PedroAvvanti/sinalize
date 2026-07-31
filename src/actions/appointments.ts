"use server";

import { revalidatePath } from "next/cache";

import {
  buildJitsiRoomName,
  isValidDuration,
  type AppointmentDuration,
} from "@/lib/domain/appointments";
import { isAppointmentReasonCode } from "@/lib/domain/reasons";
import { createClient } from "@/lib/supabase/server";

const REASON_TEXT_MAX_LENGTH = 500;

export type CreateAppointmentInput = {
  scheduledAt: string;
  durationMinutes: AppointmentDuration;
  reasonCode: string;
  reasonText?: string;
};

export type CreateAppointmentResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createAppointmentAction(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const scheduledAt = new Date(input.scheduledAt);
  const reasonText = input.reasonText?.trim() || null;

  if (
    !isValidDuration(input.durationMinutes) ||
    !isAppointmentReasonCode(input.reasonCode) ||
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getTime() <= Date.now()
  ) {
    return {
      ok: false,
      error: "Revise o motivo, a duração e escolha uma data futura.",
    };
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
      error: "Sua sessão expirou. Entre novamente para solicitar o atendimento.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || profile?.role !== "user") {
    return {
      ok: false,
      error: "Apenas contas de usuário podem solicitar atendimentos.",
    };
  }

  const appointmentId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("appointments").insert({
    id: appointmentId,
    requester_id: userId,
    status: "open",
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: input.durationMinutes,
    reason_code: input.reasonCode,
    reason_text: reasonText,
    jitsi_room_name: buildJitsiRoomName(appointmentId),
  });

  if (insertError) {
    console.error("Não foi possível criar a solicitação de atendimento.", {
      code: insertError.code,
    });
    return {
      ok: false,
      error: "Não foi possível criar sua solicitação. Tente novamente.",
    };
  }

  revalidatePath("/app/user");
  revalidatePath("/app/user/request");
  return { ok: true };
}

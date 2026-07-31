"use server";

import { revalidatePath } from "next/cache";

import {
  buildJitsiRoomName,
  isValidDuration,
  mapAcceptError,
  parseScheduledAtIso,
  type AppointmentDuration,
} from "@/lib/domain/appointments";
import { isAppointmentReasonCode } from "@/lib/domain/reasons";
import { createAdminClient } from "@/lib/supabase/admin";
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

export type AcceptAppointmentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function createAppointmentAction(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const scheduledAt = parseScheduledAtIso(input.scheduledAt);
  const reasonText = input.reasonText?.trim() || null;

  if (
    !isValidDuration(input.durationMinutes) ||
    !isAppointmentReasonCode(input.reasonCode) ||
    !scheduledAt ||
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

export async function acceptAppointmentAction(
  appointmentId: string,
): Promise<AcceptAppointmentResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      ok: false,
      message: "Sua sessão expirou. Entre novamente para aceitar o pedido.",
    };
  }

  const [
    { data: profile, error: profileError },
    { data: application, error: applicationError },
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase
      .from("interpreter_applications")
      .select("status")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (
    profileError ||
    profile?.role !== "interpreter" ||
    applicationError ||
    application?.status !== "approved"
  ) {
    return {
      ok: false,
      message: "Apenas intérpretes aprovados podem aceitar pedidos.",
    };
  }

  const { data: appointment, error: acceptError } = await supabase.rpc(
    "accept_appointment",
    { p_appointment_id: appointmentId },
  );

  if (acceptError || !appointment) {
    return {
      ok: false,
      message: mapAcceptError(acceptError),
    };
  }

  try {
    const admin = createAdminClient();
    const { error: notificationError } = await admin
      .from("notifications")
      .insert([
        {
          profile_id: appointment.requester_id,
          type: "appointment_accepted",
          title: "Pedido aceito",
          body: "Um intérprete aceitou seu pedido de atendimento.",
          related_appointment_id: appointment.id,
        },
        {
          profile_id: userId,
          type: "appointment_assigned",
          title: "Atendimento confirmado",
          body: "O atendimento foi atribuído a você.",
          related_appointment_id: appointment.id,
        },
      ]);

    if (notificationError) {
      console.error("O pedido foi aceito, mas as notificações falharam.", {
        code: notificationError.code,
        appointmentId,
      });
    }
  } catch {
    console.error(
      "O pedido foi aceito, mas o cliente de notificações não está configurado.",
      { appointmentId },
    );
  }

  revalidatePath("/app/interpreter");
  revalidatePath("/app/user");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";

import {
  canUserCancelDirectly,
  cancelRequestMessage,
  directCancelMessage,
} from "@/lib/domain/cancellations";
import { isCancellationReasonCode } from "@/lib/domain/reasons";
import { insertNotifications, notifyAdmins } from "@/lib/notifications/dispatch";
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
  revalidatePath("/app/notifications");

  if (willCancelDirectly) {
    if (appointment.interpreter_id) {
      await insertNotifications([
        {
          profile_id: appointment.interpreter_id,
          type: "appointment_cancelled",
          title: "Atendimento cancelado",
          body: "O usuário cancelou o atendimento antes do dia agendado.",
          related_appointment_id: appointment.id,
        },
      ]);
    }
  } else {
    await notifyAdmins({
      type: "cancellation_requested",
      title: "Cancelamento aguardando decisão",
      body: "Um participante solicitou cancelamento de atendimento.",
      related_appointment_id: appointment.id,
    });

    const otherParticipantId =
      profile.role === "user"
        ? appointment.interpreter_id
        : appointment.requester_id;

    if (otherParticipantId) {
      await insertNotifications([
        {
          profile_id: otherParticipantId,
          type: "cancellation_requested",
          title: "Cancelamento em análise",
          body: "Foi solicitado o cancelamento deste atendimento. Aguarde a decisão administrativa.",
          related_appointment_id: appointment.id,
        },
      ]);
    }
  }

  return {
    ok: true,
    message: willCancelDirectly
      ? directCancelMessage()
      : cancelRequestMessage(),
  };
}

export type DecideCancellationInput = {
  requestId: string;
  decision: "approved" | "rejected";
  note?: string;
};

export type DecideCancellationResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const ADMIN_NOTE_MAX_LENGTH = 500;

function mapDecideCancellationError(
  error: { message?: string } | null,
): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("only admins")) {
    return "Apenas administradores podem decidir cancelamentos.";
  }
  if (message.includes("not pending")) {
    return "Esta solicitação já foi decidida.";
  }
  if (message.includes("not awaiting cancellation")) {
    return "O atendimento não está aguardando decisão de cancelamento.";
  }
  if (message.includes("invalid cancellation decision")) {
    return "A decisão informada é inválida.";
  }

  return "Não foi possível registrar a decisão. Tente novamente.";
}

export async function decideCancellationAction(
  input: DecideCancellationInput,
): Promise<DecideCancellationResult> {
  const note = input.note?.trim() || null;

  if (
    !input.requestId ||
    (input.decision !== "approved" && input.decision !== "rejected")
  ) {
    return { ok: false, error: "A decisão informada é inválida." };
  }

  if (note && note.length > ADMIN_NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `A observação deve ter no máximo ${ADMIN_NOTE_MAX_LENGTH} caracteres.`,
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

  if (profileError || profile?.role !== "admin") {
    return {
      ok: false,
      error: "Apenas administradores podem decidir cancelamentos.",
    };
  }

  const { data: updated, error: rpcError } = await supabase.rpc(
    "decide_cancellation_request",
    {
      p_request_id: input.requestId,
      p_decision: input.decision,
      p_admin_decision_note: note,
    },
  );

  if (rpcError || !updated) {
    console.error("Não foi possível decidir o cancelamento.", {
      code: rpcError?.code,
      requestId: input.requestId,
    });
    return { ok: false, error: mapDecideCancellationError(rpcError) };
  }

  revalidatePath("/app/admin");
  revalidatePath("/app/admin/cancellations");
  revalidatePath("/app/user");
  revalidatePath("/app/interpreter");
  revalidatePath("/app/notifications");

  const participantIds = [updated.requester_id, updated.interpreter_id].filter(
    (id): id is string => Boolean(id),
  );

  if (participantIds.length > 0) {
    await insertNotifications(
      participantIds.map((profileId) => ({
        profile_id: profileId,
        type: "cancellation_decided",
        title:
          input.decision === "approved"
            ? "Cancelamento aprovado"
            : "Cancelamento não aprovado",
        body:
          input.decision === "approved"
            ? "A administração aprovou o cancelamento solicitado."
            : "A administração manteve o atendimento confirmado.",
        related_appointment_id: updated.id,
      })),
    );
  }

  return {
    ok: true,
    message:
      input.decision === "approved"
        ? "Cancelamento aprovado."
        : "Cancelamento rejeitado. O atendimento continua confirmado.",
  };
}

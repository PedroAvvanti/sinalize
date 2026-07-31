"use server";

import { revalidatePath } from "next/cache";

import {
  isValidReviewRating,
  REVIEW_COMMENT_MAX_LENGTH,
} from "@/lib/domain/reviews";
import { createClient } from "@/lib/supabase/server";

export type SubmitReviewInput = {
  appointmentId: string;
  toProfileId: string;
  rating: number;
  comment?: string;
};

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitReviewAction(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  const comment = input.comment?.trim() || null;

  if (
    !input.appointmentId ||
    !input.toProfileId ||
    !isValidReviewRating(input.rating)
  ) {
    return { ok: false, error: "Escolha uma nota de 1 a 5 estrelas." };
  }

  if (comment && comment.length > REVIEW_COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `O comentário deve ter no máximo ${REVIEW_COMMENT_MAX_LENGTH} caracteres.`,
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      ok: false,
      error: "Sua sessão expirou. Entre novamente para avaliar.",
    };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, status, requester_id, interpreter_id")
    .eq("id", input.appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return { ok: false, error: "Atendimento não encontrado." };
  }

  if (appointment.status !== "completed") {
    return {
      ok: false,
      error: "Só é possível avaliar atendimentos concluídos.",
    };
  }

  const isRequester = appointment.requester_id === userId;
  const isInterpreter = appointment.interpreter_id === userId;

  if (!isRequester && !isInterpreter) {
    return { ok: false, error: "Você não participou deste atendimento." };
  }

  const expectedRecipient = isRequester
    ? appointment.interpreter_id
    : appointment.requester_id;

  if (!expectedRecipient || expectedRecipient !== input.toProfileId) {
    return { ok: false, error: "Participante inválido para esta avaliação." };
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    appointment_id: appointment.id,
    from_profile_id: userId,
    to_profile_id: input.toProfileId,
    rating: input.rating,
    comment,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "Você já avaliou este atendimento." };
    }

    console.error("Não foi possível salvar a avaliação.", {
      code: insertError.code,
      appointmentId: input.appointmentId,
    });
    return {
      ok: false,
      error: "Não foi possível enviar sua avaliação. Tente novamente.",
    };
  }

  revalidatePath("/app/user");
  revalidatePath("/app/interpreter");
  revalidatePath(`/app/review/${input.appointmentId}`);
  return { ok: true };
}

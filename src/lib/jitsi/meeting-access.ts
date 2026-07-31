import {
  isWithinMeetingWindow,
  MEETING_EARLY_ACCESS_MINUTES,
} from "../domain/meeting-access";

export { MEETING_EARLY_ACCESS_MINUTES };

export type MeetingAppointment = {
  requesterId: string;
  interpreterId: string | null;
  status: "accepted" | "cancel_requested" | "open" | "cancelled" | "completed" | "expired";
  scheduledAt: Date;
  durationMinutes: number;
};

export type CanEnterMeetingInput = {
  appointment: MeetingAppointment;
  userId: string;
  now?: Date;
};

export type CanEnterMeetingResult =
  | { ok: true }
  | { ok: false; reason: string };

export function canEnterMeeting({
  appointment,
  userId,
  now = new Date(),
}: CanEnterMeetingInput): CanEnterMeetingResult {
  const isParticipant =
    appointment.requesterId === userId ||
    appointment.interpreterId === userId;

  if (!isParticipant) {
    return { ok: false, reason: "Você não participa deste atendimento." };
  }

  if (
    appointment.status !== "accepted" &&
    appointment.status !== "cancel_requested"
  ) {
    return {
      ok: false,
      reason: "Este atendimento ainda não está disponível para videochamada.",
    };
  }

  if (
    !isWithinMeetingWindow(
      appointment.scheduledAt,
      appointment.durationMinutes,
      now,
    )
  ) {
    return {
      ok: false,
      reason: `A sala abre ${MEETING_EARLY_ACCESS_MINUTES} minutos antes do horário agendado e encerra ao fim da duração.`,
    };
  }

  return { ok: true };
}

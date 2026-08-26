"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { completeAppointmentAction } from "@/actions/appointments";
import { resolveLeaveMeetingIntent } from "@/lib/domain/meeting-leave";

type LeaveMeetingButtonProps = {
  appointmentId: string;
  role: "user" | "interpreter";
};

export function LeaveMeetingButton({
  appointmentId,
  role,
}: LeaveMeetingButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const intent = resolveLeaveMeetingIntent(role, appointmentId);

  function handleLeave() {
    setFeedback(undefined);

    startTransition(async () => {
      if (intent.shouldComplete) {
        const result = await completeAppointmentAction(appointmentId);

        if (!result.ok) {
          setFeedback(result.error);
          return;
        }
      }

      router.push(intent.redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="leave-meeting">
      <button
        className="next-call-secondary leave-meeting__button"
        type="button"
        disabled={isPending}
        onClick={handleLeave}
      >
        {isPending ? "Saindo…" : "Sair da sala"}
      </button>
      {feedback ? (
        <p className="auth-error" role="alert">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

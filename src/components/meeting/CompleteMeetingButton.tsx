"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { completeAppointmentAction } from "@/actions/appointments";

type CompleteMeetingButtonProps = {
  appointmentId: string;
};

export function CompleteMeetingButton({
  appointmentId,
}: CompleteMeetingButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    setFeedback(undefined);

    startTransition(async () => {
      const result = await completeAppointmentAction(appointmentId);

      if (!result.ok) {
        setFeedback(result.error);
        return;
      }

      router.push(`/app/review/${appointmentId}`);
      router.refresh();
    });
  }

  return (
    <div className="complete-meeting">
      <button
        className="auth-submit complete-meeting__button"
        type="button"
        disabled={isPending}
        onClick={handleComplete}
      >
        {isPending ? "Encerrando…" : "Encerrar chamada"}
      </button>
      {feedback ? (
        <p className="auth-error" role="alert">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

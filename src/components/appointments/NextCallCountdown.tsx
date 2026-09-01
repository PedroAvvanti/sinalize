"use client";

import { useEffect, useState } from "react";

import {
  formatCountdown,
  resolveCountdownState,
  type CountdownState,
} from "@/lib/domain/countdown";
import { isWithinMeetingWindow } from "@/lib/domain/meeting-access";

type NextCallCountdownProps = {
  scheduledAtIso: string;
  durationMinutes: number;
  status: "open" | "accepted" | "cancel_requested";
};

export function NextCallCountdown({
  scheduledAtIso,
  durationMinutes,
  status,
}: NextCallCountdownProps) {
  const [state, setState] = useState<CountdownState>({ kind: "idle" });

  useEffect(() => {
    if (status !== "accepted" && status !== "cancel_requested") {
      setState({ kind: "idle" });
      return;
    }

    const scheduledAt = new Date(scheduledAtIso);

    function tick() {
      setState(resolveCountdownState(scheduledAt, durationMinutes));
    }

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [scheduledAtIso, durationMinutes, status]);

  if (state.kind === "idle") {
    return null;
  }

  const scheduledAt = new Date(scheduledAtIso);
  const inWindow = isWithinMeetingWindow(scheduledAt, durationMinutes);
  const className =
    state.kind === "reminder"
      ? "next-call-countdown next-call-countdown--reminder"
      : state.kind === "live" || inWindow
        ? "next-call-countdown next-call-countdown--live"
        : "next-call-countdown";

  return (
    <p className={className} role="status" aria-live="polite">
      {state.kind === "waiting" && !inWindow
        ? state.label
        : state.kind === "reminder"
          ? state.label
          : state.kind === "live"
            ? state.label
            : `Começa em ${formatCountdown(scheduledAt.getTime() - Date.now())}`}
    </p>
  );
}

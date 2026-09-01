import { MEETING_EARLY_ACCESS_MINUTES } from "./meeting-access";

export type CountdownState =
  | { kind: "idle" }
  | { kind: "waiting"; label: string }
  | { kind: "reminder"; label: string }
  | { kind: "live"; label: string };

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  }

  if (minutes > 0) {
    return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

export function resolveCountdownState(
  scheduledAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): CountdownState {
  const startMs = scheduledAt.getTime();
  const windowStartMs =
    startMs - MEETING_EARLY_ACCESS_MINUTES * 60 * 1000;
  const endMs = startMs + durationMinutes * 60 * 1000;
  const current = now.getTime();

  if (current >= windowStartMs && current <= endMs) {
    return { kind: "live", label: "Sala aberta — você pode entrar agora" };
  }

  if (current > endMs) {
    return { kind: "idle" };
  }

  const msUntilWindow = windowStartMs - current;
  const msUntilStart = startMs - current;
  const reminderThresholdMs = 10 * 60 * 1000;

  if (msUntilStart > 0 && msUntilStart <= reminderThresholdMs) {
    return {
      kind: "reminder",
      label: `Sua chamada começa em ${formatCountdown(msUntilStart)}`,
    };
  }

  if (msUntilWindow > 0) {
    return {
      kind: "waiting",
      label: `Sala abre em ${formatCountdown(msUntilWindow)}`,
    };
  }

  return { kind: "idle" };
}

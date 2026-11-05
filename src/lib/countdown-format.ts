export function msUntil(isoTarget: string, now = Date.now()): number {
  return Math.max(0, new Date(isoTarget).getTime() - now);
}

/** e.g. `14:32` or `1:05:30` when over an hour remains */
export function formatCountdownMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type TurnWaitPhase = "done" | "now" | "up-next" | "countdown";

/** Countdown applies only to whoever is first in line (current turnIndex). */
export function turnWaitPhase(
  index: number,
  turnIndex: number,
  complete: boolean,
  slotStartIso: string,
  now = Date.now(),
): TurnWaitPhase {
  if (complete || index < turnIndex) return "done";
  if (index > turnIndex) return "up-next";
  if (msUntil(slotStartIso, now) > 0) return "countdown";
  return "now";
}

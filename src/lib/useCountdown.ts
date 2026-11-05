"use client";

import { useEffect, useState } from "react";
import { formatCountdownMs, msUntil } from "@/lib/countdown-format";

export function useCountdown(isoTarget: string | undefined) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!isoTarget) {
      setRemainingMs(null);
      return;
    }

    function tick() {
      setRemainingMs(msUntil(isoTarget!));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoTarget]);

  const formatted =
    remainingMs === null ? null : formatCountdownMs(remainingMs);
  const isDue = remainingMs !== null && remainingMs <= 0;

  return { remainingMs, formatted, isDue };
}

/** @deprecated Use useCountdown for second-accurate display */
export function useCountdownMinutes(isoTarget: string | undefined): number | null {
  const { remainingMs } = useCountdown(isoTarget);
  if (remainingMs === null) return null;
  return Math.ceil(remainingMs / 60_000);
}

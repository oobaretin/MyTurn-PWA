"use client";

import { useEffect, useState } from "react";

export function useCountdownMinutes(isoTarget: string | undefined): number | null {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!isoTarget) {
      setMinutes(null);
      return;
    }

    function tick() {
      const target = new Date(isoTarget!).getTime();
      const diff = target - Date.now();
      setMinutes(Math.max(0, Math.ceil(diff / 60_000)));
    }

    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [isoTarget]);

  return minutes;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MobileShell, PrimaryButton } from "./MobileShell";

type Routine = "evening" | "morning";

export function AlarmView({
  shareToken,
  routine,
}: {
  shareToken: string;
  routine: Routine;
}) {
  const [acting, setActing] = useState(false);
  const audioRef = useRef<OscillatorNode | null>(null);

  const stopSound = useCallback(() => {
    try {
      audioRef.current?.stop();
    } catch {
      /* already stopped */
    }
    audioRef.current = null;
  }, []);

  const startSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      audioRef.current = osc;
      if ("vibrate" in navigator) {
        navigator.vibrate([400, 200, 400, 200, 400]);
      }
    } catch {
      /* autoplay blocked until tap */
    }
  }, []);

  useEffect(() => {
    startSound();
    return () => stopSound();
  }, [startSound, stopSound]);

  async function done() {
    stopSound();
    setActing(true);
    await fetch(`/api/k/${shareToken}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "done", routine }),
    });
    window.location.href = `/k/${shareToken}?routine=${routine}`;
  }

  const label =
    routine === "evening" ? "Shower time!" : "Get ready for school!";

  return (
    <MobileShell title={label} subtitle="Tap Done when you're heading in">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
        <div className="animate-pulse text-7xl">⏰</div>
        <PrimaryButton
          onClick={() => {
            startSound();
          }}
        >
          Play alarm sound
        </PrimaryButton>
        <PrimaryButton disabled={acting} onClick={done}>
          Done — my turn
        </PrimaryButton>
      </div>
    </MobileShell>
  );
}

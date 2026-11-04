"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MobileShell, PrimaryButton, StickyActionBar } from "./MobileShell";
import { IconShower, IconSunrise } from "./ui/Icons";

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
  const Icon = routine === "evening" ? IconShower : IconSunrise;

  return (
    <MobileShell title={label} subtitle="Tap Done when you're heading in">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span
            className="absolute inset-0 animate-ping rounded-full bg-rose-500/20"
            aria-hidden
          />
          <span
            className="absolute inset-4 animate-pulse rounded-full bg-orange-500/25"
            aria-hidden
          />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 shadow-2xl shadow-rose-600/40">
            <Icon className="h-14 w-14 text-white" />
          </div>
        </div>
        <PrimaryButton variant="secondary" onClick={startSound}>
          Play alarm sound
        </PrimaryButton>
      </div>
      <StickyActionBar>
        <PrimaryButton disabled={acting} loading={acting} onClick={done}>
          Done — I&apos;m going
        </PrimaryButton>
      </StickyActionBar>
    </MobileShell>
  );
}

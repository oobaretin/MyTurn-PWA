"use client";

import { useEffect, useRef, useState } from "react";
import { MobileShell, PrimaryButton, StickyActionBar } from "./MobileShell";
import { StatusBanner } from "./ui/StatusBanner";
import { IconShower, IconSunrise } from "./ui/Icons";
import { startAlarmSound } from "@/lib/alarm-sound";

type Routine = "evening" | "morning";

export function AlarmView({
  shareToken,
  routine,
}: {
  shareToken: string;
  routine: Routine;
}) {
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alarmRef = useRef<ReturnType<typeof startAlarmSound> | null>(null);
  const userDismissedRef = useRef(false);

  useEffect(() => {
    alarmRef.current?.stop();
    alarmRef.current = startAlarmSound();
    return () => {
      if (userDismissedRef.current) {
        alarmRef.current?.stop();
        alarmRef.current = null;
      }
    };
  }, []);

  function nudgeSound() {
    alarmRef.current?.nudge();
  }

  async function ackStart() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/k/${encodeURIComponent(shareToken)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", routine }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start");

      userDismissedRef.current = true;
      alarmRef.current?.stop();
      alarmRef.current = null;

      window.location.href = `/k/${encodeURIComponent(shareToken)}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start");
      setActing(false);
    }
  }

  const label =
    routine === "evening" ? "Shower time!" : "Get ready for school!";
  const Icon = routine === "evening" ? IconShower : IconSunrise;

  return (
    <MobileShell
      title={label}
      subtitle="Alarm stops when you tap I'm going below"
    >
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
        <PrimaryButton variant="secondary" onClick={nudgeSound}>
          Can&apos;t hear it? Tap here
        </PrimaryButton>
      </div>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <StickyActionBar>
        <PrimaryButton disabled={acting} loading={acting} onClick={ackStart}>
          I&apos;m going — start my turn
        </PrimaryButton>
      </StickyActionBar>
    </MobileShell>
  );
}

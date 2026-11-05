"use client";

import { useCountdown } from "@/lib/useCountdown";
import {
  turnWaitPhase,
  type TurnWaitPhase,
} from "@/lib/countdown-format";

function phaseLabel(phase: TurnWaitPhase): string {
  switch (phase) {
    case "done":
      return "Done";
    case "now":
      return "Now";
    case "up-next":
      return "Up next";
    case "countdown":
      return "";
  }
}

export function TurnCountdown({
  index,
  turnIndex,
  complete,
  slotStartIso,
  slotLocalTime,
  size = "sm",
  heading,
}: {
  index: number;
  turnIndex: number;
  complete: boolean;
  slotStartIso: string;
  slotLocalTime?: string;
  size?: "sm" | "lg";
  /** e.g. "Turn starts in" for the kid first in line */
  heading?: string;
}) {
  const phase = turnWaitPhase(index, turnIndex, complete, slotStartIso);
  const { formatted } = useCountdown(
    phase === "countdown" ? slotStartIso : undefined,
  );

  const label = phaseLabel(phase);
  const isLg = size === "lg";

  if (phase === "countdown" && formatted) {
    return (
      <div
        className={`${isLg ? "space-y-1 text-center" : "text-right"}`}
      >
        {heading && isLg ? (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {heading}
          </p>
        ) : null}
        {slotLocalTime ? (
          <p
            className={
              isLg
                ? "text-xs font-medium text-slate-500"
                : "text-[10px] text-slate-600"
            }
          >
            {slotLocalTime}
          </p>
        ) : null}
        <p
          className={`font-mono tabular-nums ${
            isLg
              ? "text-2xl font-bold tracking-tight text-amber-100"
              : "text-xs font-semibold text-slate-400"
          }`}
        >
          {formatted}
        </p>
      </div>
    );
  }

  const tone =
    phase === "now"
      ? "text-indigo-300"
      : phase === "up-next"
        ? "text-amber-300"
        : "text-slate-600";

  return (
    <div className="text-right">
      {slotLocalTime && phase !== "done" ? (
        <p
          className={
            isLg ? "text-xs text-slate-500" : "text-[10px] text-slate-600"
          }
        >
          {slotLocalTime}
        </p>
      ) : null}
      <span
        className={`font-semibold ${tone} ${
          isLg ? "text-sm" : "text-xs"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

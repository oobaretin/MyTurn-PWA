"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, MobileShell, PrimaryButton } from "./MobileShell";
import { PushSubscribe } from "./PushSubscribe";
import { RoutineToggle } from "./RoutineToggle";
import { KidAvatar } from "./ui/KidAvatar";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";
import { StatusBanner } from "./ui/StatusBanner";
import { useCountdownMinutes } from "@/lib/useCountdown";

type Routine = "evening" | "morning";

type StateResponse = {
  kid: { id: string; name: string; color: string };
  routine: Routine;
  isMyTurn: boolean;
  complete: boolean;
  currentKid: { id: string; name: string; color: string } | null;
  minutesUntilTurn: number;
  turnIndex: number;
  slotStartIso?: string;
  started: boolean;
  order: { id: string; name: string; color: string }[];
};

export function KidTurnView({
  shareToken,
  initialRoutine,
}: {
  shareToken: string;
  initialRoutine: Routine;
}) {
  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [state, setState] = useState<StateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const countdown = useCountdownMinutes(
    state && !state.isMyTurn ? state.slotStartIso : undefined,
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/k/${shareToken}/state?routine=${routine}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setState(data as StateResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [shareToken, routine]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  async function act(action: "start" | "done") {
    setActing(true);
    try {
      const res = await fetch(`/api/k/${shareToken}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, routine }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActing(false);
    }
  }

  const routineLabel =
    routine === "evening" ? "Evening shower" : "Get ready for school";

  return (
    <MobileShell title={state?.kid.name ?? "…"} subtitle={routineLabel}>
      <RoutineToggle value={routine} onChange={setRoutine} />

      <PushSubscribe shareToken={shareToken} />

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <StatusBanner tone="error">
          {error.toLowerCase().includes("not found") ? (
            <>
              <p className="font-medium">This link isn&apos;t valid</p>
              <p className="mt-1 text-rose-100/90">
                Ask a parent to open Family setup, tap{" "}
                <strong>Copy full link</strong>, and text the whole URL starting
                with https:// (not a cut-off /k/… line).
              </p>
            </>
          ) : (
            error
          )}
        </StatusBanner>
      ) : state ? (
        <div className="animate-fade-up flex flex-col gap-4">
          <Card className="relative overflow-hidden">
            {state.isMyTurn && !state.complete ? (
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
                style={{ backgroundColor: state.kid.color }}
              />
            ) : null}

            {state.complete ? (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="text-4xl" aria-hidden>
                  ✨
                </span>
                <p className="mt-3 text-xl font-bold text-emerald-300">
                  All done for today!
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Great job — see you next round.
                </p>
              </div>
            ) : state.isMyTurn ? (
              <div className="flex flex-col items-center py-2 text-center">
                <KidAvatar
                  name={state.kid.name}
                  color={state.kid.color}
                  size="xl"
                  pulse
                />
                <p className="mt-5 text-2xl font-black tracking-tight text-white">
                  It&apos;s your turn!
                </p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                  Tap <strong className="text-slate-200">Start</strong> when you
                  begin, then <strong className="text-slate-200">Done</strong>{" "}
                  when you finish.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2 text-center">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Up now
                </p>
                {state.currentKid ? (
                  <KidAvatar
                    name={state.currentKid.name}
                    color={state.currentKid.color}
                    size="lg"
                  />
                ) : null}
                <p
                  className="mt-3 text-2xl font-bold"
                  style={{ color: state.currentKid?.color ?? "#fff" }}
                >
                  {state.currentKid?.name ?? "—"}
                </p>
                {(countdown ?? state.minutesUntilTurn) > 0 ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-sm text-slate-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                    Your turn in ~{countdown ?? state.minutesUntilTurn} min
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Almost your turn</p>
                )}
              </div>
            )}
          </Card>

          {!state.complete && state.isMyTurn ? (
            <div className="flex flex-col gap-3">
              {!state.started ? (
                <>
                  <PrimaryButton
                    disabled={acting}
                    loading={acting}
                    onClick={() => act("start")}
                  >
                    Start my turn
                  </PrimaryButton>
                  <PrimaryButton
                    variant="secondary"
                    disabled={acting}
                    onClick={() => act("done")}
                  >
                    Skip ahead (Done)
                  </PrimaryButton>
                </>
              ) : (
                <>
                  <StatusBanner tone="success" icon="●">
                    In progress — tap Done when you finish.
                  </StatusBanner>
                  <PrimaryButton
                    variant="danger"
                    disabled={acting}
                    loading={acting}
                    onClick={() => act("done")}
                  >
                    Done — notify next
                  </PrimaryButton>
                </>
              )}
            </div>
          ) : null}

          <Card>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Today&apos;s order
            </p>
            <ol className="space-y-2">
              {state.order.map((k, i) => {
                const isCurrent = i === state.turnIndex && !state.complete;
                const isMe = k.id === state.kid.id;
                return (
                  <li
                    key={k.id}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
                      isCurrent
                        ? "border border-indigo-400/40 bg-indigo-500/15"
                        : "bg-black/25"
                    } ${isMe ? "ring-1 ring-white/10" : ""}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? "bg-indigo-500 text-white"
                          : "bg-white/10 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <KidAvatar name={k.name} color={k.color} size="md" />
                    <span className="flex-1 font-medium text-slate-100">
                      {k.name}
                      {isMe ? (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          (you)
                        </span>
                      ) : null}
                    </span>
                    {isCurrent ? (
                      <span className="text-xs font-semibold text-indigo-300">
                        Now
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      ) : null}
    </MobileShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, MobileShell, PrimaryButton } from "./MobileShell";
import { PushSubscribe } from "./PushSubscribe";

type Routine = "evening" | "morning";

type StateResponse = {
  kid: { id: string; name: string; color: string };
  routine: Routine;
  isMyTurn: boolean;
  complete: boolean;
  currentKid: { id: string; name: string; color: string } | null;
  minutesUntilTurn: number;
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
    <MobileShell
      title={state?.kid.name ?? "MyTurn"}
      subtitle={routineLabel}
    >
      <div className="flex gap-2">
        {(["evening", "morning"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoutine(r)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${
              routine === r
                ? "bg-indigo-500 text-white"
                : "bg-white/10 text-slate-300"
            }`}
          >
            {r === "evening" ? "Evening" : "Morning"}
          </button>
        ))}
      </div>

      <PushSubscribe shareToken={shareToken} />

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : error ? (
        <p className="text-rose-300">{error}</p>
      ) : state ? (
        <>
          <Card>
            {state.complete ? (
              <p className="text-center text-xl font-semibold text-emerald-300">
                All done for today!
              </p>
            ) : state.isMyTurn ? (
              <div className="text-center">
                <p
                  className="text-4xl font-black"
                  style={{ color: state.kid.color }}
                >
                  It&apos;s your turn!
                </p>
                <p className="mt-2 text-slate-300">Tap when you start and when you&apos;re done.</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg text-slate-300">Up now</p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: state.currentKid?.color ?? "#fff" }}
                >
                  {state.currentKid?.name ?? "—"}
                </p>
                {state.minutesUntilTurn > 0 ? (
                  <p className="mt-2 text-slate-400">
                    Your turn in ~{state.minutesUntilTurn} min
                  </p>
                ) : null}
              </div>
            )}
          </Card>

          {!state.complete && state.isMyTurn ? (
            <div className="flex flex-col gap-3">
              {!state.started ? (
                <PrimaryButton disabled={acting} onClick={() => act("start")}>
                  Start
                </PrimaryButton>
              ) : null}
              <PrimaryButton disabled={acting} onClick={() => act("done")}>
                Done
              </PrimaryButton>
            </div>
          ) : null}

          <Card>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Today&apos;s order
            </p>
            <ol className="space-y-2">
              {state.order.map((k, i) => (
                <li
                  key={k.id}
                  className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-2"
                >
                  <span className="text-slate-500">{i + 1}.</span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: k.color }}
                  />
                  <span className="font-medium">{k.name}</span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      ) : null}
    </MobileShell>
  );
}

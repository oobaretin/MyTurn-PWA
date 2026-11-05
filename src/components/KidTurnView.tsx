"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  MobileShell,
  PrimaryButton,
  StickyActionBar,
} from "./MobileShell";
import { PushSubscribe } from "./PushSubscribe";
import { KidAvatar } from "./ui/KidAvatar";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";
import { StatusBanner } from "./ui/StatusBanner";
import { TurnCountdown } from "./ui/TurnCountdown";

type Routine = "evening" | "morning";

type StateResponse = {
  kid: { id: string; name: string; color: string };
  routine: Routine;
  isMyTurn: boolean;
  complete: boolean;
  currentKid: { id: string; name: string; color: string } | null;
  turnIndex: number;
  started: boolean;
  mySlotLocalTime?: string | null;
  order: {
    id: string;
    name: string;
    color: string;
    slotStartIso: string;
    slotLocalTime: string;
  }[];
};

function defaultRoutine(): Routine {
  const h = new Date().getHours();
  return h >= 16 || h < 10 ? "evening" : "morning";
}

function shellCopy(
  state: StateResponse | null,
  routine: Routine,
  loading: boolean,
): { title: string; subtitle: string } {
  const routineLabel =
    routine === "evening" ? "Evening shower" : "Morning routine";
  if (loading || !state) {
    return { title: "MyTurn", subtitle: routineLabel };
  }
  if (state.complete) {
    return { title: "All done!", subtitle: `Nice work, ${state.kid.name}` };
  }
  if (state.isMyTurn) {
    return { title: "It's your turn!", subtitle: routineLabel };
  }
  const current = state.currentKid?.name ?? "Someone";
  return {
    title: `${current}'s turn`,
    subtitle: `Hi ${state.kid.name} · ${routineLabel}`,
  };
}

export function KidTurnView({
  shareToken,
  initialRoutine,
}: {
  shareToken: string;
  initialRoutine?: Routine;
}) {
  const [routine] = useState<Routine>(
    initialRoutine ?? defaultRoutine(),
  );
  const [state, setState] = useState<StateResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const firstLoad = useRef(true);
  const prevIsMyTurn = useRef(false);
  const router = useRouter();

  const load = useCallback(async () => {
    if (!firstLoad.current) setRefreshing(true);
    try {
      const res = await fetch(
        `/api/k/${encodeURIComponent(shareToken)}/state?routine=${routine}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setState(data as StateResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setInitialLoading(false);
      firstLoad.current = false;
      setRefreshing(false);
    }
  }, [shareToken, routine]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    void (async () => {
      if (Notification.permission !== "granted") {
        setAlertsEnabled(false);
        return;
      }
      const reg = await navigator.serviceWorker?.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      setAlertsEnabled(!!sub);
    })();
  }, []);

  useEffect(() => {
    if (!state || state.complete) return;
    if (!state.isMyTurn) {
      prevIsMyTurn.current = false;
      return;
    }
    const becameMine = !prevIsMyTurn.current;
    prevIsMyTurn.current = true;
    if (!becameMine) return;

    const key = `myturn-alarm-${routine}-${state.turnIndex}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    router.push(
      `/k/${encodeURIComponent(shareToken)}/alarm?routine=${routine}`,
    );
  }, [state, routine, shareToken, router]);

  async function act(action: "start" | "done") {
    setActing(true);
    try {
      const res = await fetch(`/api/k/${encodeURIComponent(shareToken)}/action`, {
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

  const { title, subtitle } = shellCopy(state, routine, initialLoading);

  const actionBar =
    state && !state.complete && state.isMyTurn ? (
      <StickyActionBar>
        {!state.started ? (
          <PrimaryButton
            disabled={acting}
            loading={acting}
            onClick={() => act("start")}
          >
            Start my turn
          </PrimaryButton>
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
      </StickyActionBar>
    ) : null;

  return (
    <MobileShell title={title} subtitle={subtitle}>
      {refreshing ? (
        <p className="text-center text-[10px] font-medium uppercase tracking-wider text-slate-600">
          Updating…
        </p>
      ) : null}

      {initialLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <StatusBanner tone="error">
          {error.toLowerCase().includes("not found") ? (
            <>
              <p className="font-medium">Link expired or invalid</p>
              <p className="mt-1 text-rose-100/90">
                Ask a parent to send a new link from Settings.
              </p>
            </>
          ) : (
            error
          )}
        </StatusBanner>
      ) : state ? (
        <div className="animate-fade-up flex flex-col gap-4 pb-32">
          {!alertsEnabled && !state.complete ? (
            <PushSubscribe
              shareToken={shareToken}
              urgent={state.isMyTurn}
              onEnabled={() => setAlertsEnabled(true)}
            />
          ) : null}

          <Card className="relative overflow-hidden">
            {state.isMyTurn && !state.complete ? (
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
                style={{ backgroundColor: state.kid.color }}
              />
            ) : null}

            {state.complete ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="text-4xl animate-fade-up" aria-hidden>
                  ✨
                </span>
                <KidAvatar
                  name={state.kid.name}
                  color={state.kid.color}
                  size="lg"
                />
                <p className="mt-4 text-sm text-slate-400">
                  See you at the next round.
                </p>
              </div>
            ) : state.isMyTurn ? (
              <div className="flex flex-col items-center py-4 text-center">
                <KidAvatar
                  name={state.kid.name}
                  color={state.kid.color}
                  size="xl"
                  pulse
                />
                <p className="mt-4 text-sm text-slate-400">
                  Tap Start when you begin, Done when you&apos;re finished.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                {state.currentKid ? (
                  <KidAvatar
                    name={state.currentKid.name}
                    color={state.currentKid.color}
                    size="lg"
                  />
                ) : null}
                <p className="mt-3 text-sm text-slate-400">
                  {state.currentKid?.name ?? "Someone"} is up now
                </p>
                {(() => {
                  const myIndex = state.order.findIndex(
                    (k) => k.id === state.kid.id,
                  );
                  const mySlot = state.order[myIndex];
                  if (myIndex < 0 || !mySlot) return null;
                  return (
                    <div className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Your scheduled turn
                      </p>
                      <div className="mt-2 flex items-center justify-center">
                        <TurnCountdown
                          index={myIndex}
                          turnIndex={state.turnIndex}
                          complete={state.complete}
                          slotStartIso={mySlot.slotStartIso}
                          slotLocalTime={
                            state.mySlotLocalTime ?? mySlot.slotLocalTime
                          }
                          size="lg"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>

          <Card>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowLineup((v) => !v)}
            >
              <p className="text-sm font-semibold text-slate-200">
                {showLineup ? "Hide lineup" : "Who's in line"}
              </p>
              <span className="text-indigo-300">{showLineup ? "−" : "+"}</span>
            </button>
            {showLineup ? (
              <ol className="mt-3 space-y-2 border-t border-white/10 pt-3">
                {state.order.map((k, i) => {
                  const isCurrent = i === state.turnIndex && !state.complete;
                  const isMe = k.id === state.kid.id;
                  return (
                    <li
                      key={k.id}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                        isCurrent
                          ? "border border-indigo-400/40 bg-indigo-500/15"
                          : "bg-black/25"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-500">
                        {i + 1}
                      </span>
                      <KidAvatar name={k.name} color={k.color} size="md" />
                      <span className="flex-1 font-medium text-slate-100">
                        {k.name}
                        {isMe ? (
                          <span className="ml-2 text-xs text-slate-500">(you)</span>
                        ) : null}
                      </span>
                      <TurnCountdown
                        index={i}
                        turnIndex={state.turnIndex}
                        complete={state.complete}
                        slotStartIso={k.slotStartIso}
                        slotLocalTime={k.slotLocalTime}
                      />
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </Card>

          {alertsEnabled ? (
            <PushSubscribe shareToken={shareToken} />
          ) : null}
        </div>
      ) : null}

      {actionBar}
    </MobileShell>
  );
}

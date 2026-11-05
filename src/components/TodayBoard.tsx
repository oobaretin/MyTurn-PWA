"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { saveLastHouseholdId } from "@/lib/household-storage";
import { Card, MobileShell, PrimaryButton } from "./MobileShell";
import { IconShower, IconSunrise } from "./ui/Icons";
import { KidAvatar } from "./ui/KidAvatar";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";
import { ParentNav } from "./ui/ParentNav";
import { StatusBanner } from "./ui/StatusBanner";
import { TurnCountdown } from "./ui/TurnCountdown";
import { WelcomeKidLinks } from "./ui/WelcomeKidLinks";

type Snapshot = {
  label: string;
  turnIndex: number;
  current: { name: string; color: string } | null;
  complete: boolean;
  order: {
    id: string;
    name: string;
    color: string;
    slotStartIso: string;
    slotLocalTime: string;
  }[];
};

type Routine = "evening" | "morning";

function RoutineCard({
  snap,
  routine,
  icon: Icon,
  skipping,
  onAdvance,
}: {
  snap: Snapshot;
  routine: Routine;
  icon: typeof IconShower;
  skipping: boolean;
  onAdvance: (routine: Routine) => void;
}) {
  const [showLineup, setShowLineup] = useState(false);
  const upNext =
    !snap.complete && snap.turnIndex + 1 < snap.order.length
      ? snap.order[snap.turnIndex + 1]
      : null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-indigo-300" />
          <h2 className="text-base font-semibold text-white">{snap.label}</h2>
        </div>
        {!snap.complete && snap.current ? (
          <PrimaryButton
            variant="secondary"
            disabled={skipping}
            loading={skipping}
            onClick={() => onAdvance(routine)}
          >
            Advance turn
          </PrimaryButton>
        ) : null}
      </div>
      {snap.complete ? (
        <p className="text-lg font-medium text-emerald-300">All done</p>
      ) : snap.current ? (
        <div className="flex items-center gap-4">
          <KidAvatar
            name={snap.current.name}
            color={snap.current.color}
            size="lg"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Up now
            </p>
            <p
              className="text-2xl font-bold tracking-tight"
              style={{ color: snap.current.color }}
            >
              {snap.current.name}
            </p>
            {upNext ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">Next: {upNext.name}</p>
                <TurnCountdown
                  index={snap.turnIndex + 1}
                  turnIndex={snap.turnIndex}
                  complete={snap.complete}
                  slotStartIso={upNext.slotStartIso}
                  slotLocalTime={upNext.slotLocalTime}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-slate-400">—</p>
      )}
      {snap.order.length > 0 ? (
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-indigo-300"
          onClick={() => setShowLineup((v) => !v)}
        >
          {showLineup ? "Hide lineup" : "Show full lineup"}
        </button>
      ) : null}
      {showLineup ? (
        <ol className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          {snap.order.map((k, i) => (
            <li
              key={k.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                !snap.complete && i === snap.turnIndex
                  ? "bg-indigo-500/15 text-indigo-100"
                  : "text-slate-500"
              }`}
            >
              <span className="w-4 tabular-nums text-slate-600">{i + 1}</span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: k.color }}
              />
              <span className="min-w-0 flex-1 truncate">{k.name}</span>
              <TurnCountdown
                index={i}
                turnIndex={snap.turnIndex}
                complete={snap.complete}
                slotStartIso={k.slotStartIso}
                slotLocalTime={k.slotLocalTime}
              />
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

export function TodayBoard({
  householdId,
  welcome = false,
}: {
  householdId: string;
  welcome?: boolean;
}) {
  const [data, setData] = useState<{
    household: { name: string; date: string };
    evening: Snapshot;
    morning: Snapshot;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcomeKids, setWelcomeKids] = useState<
    { name: string; color: string; shareUrl: string }[]
  >([]);
  const [skipping, setSkipping] = useState<Routine | null>(null);

  useEffect(() => {
    saveLastHouseholdId(householdId);
  }, [householdId]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/households/${householdId}/today`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    }
  }, [householdId]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!welcome) return;
    fetch(`/api/households/${householdId}/settings`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.kids) return;
        setWelcomeKids(
          d.kids.map((k: { name: string; color: string; shareUrl: string; sharePath?: string }) => ({
            name: k.name,
            color: k.color,
            shareUrl:
              k.shareUrl ||
              `${typeof window !== "undefined" ? window.location.origin : ""}${k.sharePath ?? ""}`,
          })),
        );
      })
      .catch(() => {});
  }, [welcome, householdId]);

  async function advanceTurn(routine: Routine) {
    setSkipping(routine);
    try {
      const res = await fetch(`/api/households/${householdId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routine }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Could not advance");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not advance");
    } finally {
      setSkipping(null);
    }
  }

  if (!data && !error) {
    return (
      <MobileShell title="Today" subtitle="Loading…">
        <LoadingSkeleton />
      </MobileShell>
    );
  }

  if (error && !data) {
    return (
      <MobileShell title="Today" subtitle="Something went wrong">
        <StatusBanner tone="error">{error}</StatusBanner>
        <PrimaryButton onClick={() => void load()}>Try again</PrimaryButton>
        <Link
          href="/"
          className="text-center text-sm font-semibold text-indigo-300"
        >
          Go home
        </Link>
        <ParentNav householdId={householdId} active="today" />
      </MobileShell>
    );
  }

  if (!data) return null;

  return (
    <MobileShell
      title={data.household.name}
      subtitle={`Today · ${data.household.date}`}
    >
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {welcome ? <WelcomeKidLinks kids={welcomeKids} /> : null}
      <div className="animate-fade-up flex flex-col gap-4">
        <RoutineCard
          snap={data.evening}
          routine="evening"
          icon={IconShower}
          skipping={skipping === "evening"}
          onAdvance={advanceTurn}
        />
        <RoutineCard
          snap={data.morning}
          routine="morning"
          icon={IconSunrise}
          skipping={skipping === "morning"}
          onAdvance={advanceTurn}
        />
      </div>
      <Link
        href={`/h/${householdId}/setup`}
        className="text-center text-sm font-semibold text-slate-400"
      >
        Schedule & kid links
      </Link>
      <ParentNav householdId={householdId} active="today" />
    </MobileShell>
  );
}

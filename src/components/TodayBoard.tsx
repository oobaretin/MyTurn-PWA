"use client";

import { useEffect, useState } from "react";
import { Card, MobileShell } from "./MobileShell";
import { IconShower, IconSunrise } from "./ui/Icons";
import { KidAvatar } from "./ui/KidAvatar";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";

type Snapshot = {
  label: string;
  turnIndex: number;
  current: { name: string; color: string } | null;
  complete: boolean;
  order: { name: string; color: string }[];
};

export function TodayBoard({ householdId }: { householdId: string }) {
  const [data, setData] = useState<{
    household: { name: string; date: string };
    evening: Snapshot;
    morning: Snapshot;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/households/${householdId}/today`);
      if (res.ok) setData(await res.json());
    }
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [householdId]);

  if (!data) {
    return (
      <MobileShell title="Today" subtitle="Loading…">
        <LoadingSkeleton />
      </MobileShell>
    );
  }

  function RoutineCard({
    snap,
    icon: Icon,
  }: {
    snap: Snapshot;
    icon: typeof IconShower;
  }) {
    return (
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-5 w-5 text-indigo-300" />
          <h2 className="text-base font-semibold">{snap.label}</h2>
        </div>
        {snap.complete ? (
          <p className="text-emerald-300">All done ✓</p>
        ) : snap.current ? (
          <div className="flex items-center gap-3">
            <KidAvatar name={snap.current.name} color={snap.current.color} />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Now
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: snap.current.color }}
              >
                {snap.current.name}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400">—</p>
        )}
        <ol className="mt-4 space-y-1.5">
          {snap.order.map((k, i) => (
            <li
              key={`${k.name}-${i}`}
              className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
                !snap.complete && i === snap.turnIndex
                  ? "bg-indigo-500/15 text-indigo-100"
                  : "text-slate-400"
              }`}
            >
              <span className="w-4 text-slate-600">{i + 1}.</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: k.color }}
              />
              {k.name}
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  return (
    <MobileShell
      title={data.household.name}
      subtitle={`Today · ${data.household.date}`}
    >
      <div className="animate-fade-up flex flex-col gap-4">
        <RoutineCard snap={data.evening} icon={IconShower} />
        <RoutineCard snap={data.morning} icon={IconSunrise} />
      </div>
      <a
        href={`/h/${householdId}/setup`}
        className="mt-2 block text-center text-sm font-medium text-indigo-300 underline-offset-4 hover:underline"
      >
        Parent setup →
      </a>
    </MobileShell>
  );
}

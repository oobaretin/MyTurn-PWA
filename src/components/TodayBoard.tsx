"use client";

import { useEffect, useState } from "react";
import { Card, MobileShell } from "./MobileShell";

type Snapshot = {
  label: string;
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
        <p className="text-slate-400">Loading…</p>
      </MobileShell>
    );
  }

  function RoutineCard({ snap }: { snap: Snapshot }) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">{snap.label}</h2>
        {snap.complete ? (
          <p className="mt-2 text-emerald-300">Complete</p>
        ) : (
          <p className="mt-2 text-2xl font-bold" style={{ color: snap.current?.color }}>
            {snap.current?.name ?? "—"}
          </p>
        )}
        <ol className="mt-3 space-y-1 text-sm text-slate-300">
          {snap.order.map((k, i) => (
            <li key={`${k.name}-${i}`}>
              {i + 1}. {k.name}
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
      <RoutineCard snap={data.evening} />
      <RoutineCard snap={data.morning} />
      <a
        href={`/h/${householdId}/setup`}
        className="text-center text-indigo-300 underline"
      >
        Parent setup
      </a>
    </MobileShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, MobileShell, PrimaryButton } from "./MobileShell";

const COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6"];

export function HomeCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("Our family");
  const [pin, setPin] = useState("");
  const [kidNames, setKidNames] = useState(["", ""]);
  const [eveningStartTime, setEveningStartTime] = useState("19:30");
  const [morningStartTime, setMorningStartTime] = useState("06:30");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinId, setJoinId] = useState("");

  async function create() {
    setLoading(true);
    setError(null);
    const kids = kidNames
      .map((n, i) => ({ name: n.trim(), color: COLORS[i % COLORS.length] }))
      .filter((k) => k.name.length > 0);
    if (kids.length === 0) {
      setError("Add at least one kid");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          pin: pin || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          eveningStartTime,
          morningStartTime,
          kids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/h/${data.householdId}/setup`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function goJoin() {
    if (joinId.trim()) {
      router.push(`/h/${joinId.trim()}/setup`);
    }
  }

  return (
    <MobileShell
      title="Shower & school turns"
      subtitle="Fair rotation, reminders, and alarms for your kids"
    >
      {error ? <p className="text-rose-300">{error}</p> : null}

      <Card>
        <label className="text-sm text-slate-400">Family name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-lg text-white"
        />
        <label className="mt-4 text-sm text-slate-400">
          Parent PIN (optional, 4+ digits)
        </label>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
        <p className="mt-4 text-sm font-medium text-slate-300">Kids</p>
        {kidNames.map((kn, i) => (
          <input
            key={i}
            value={kn}
            onChange={(e) => {
              const next = [...kidNames];
              next[i] = e.target.value;
              setKidNames(next);
            }}
            placeholder={`Kid ${i + 1} name`}
            className="mt-2 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
          />
        ))}
        {kidNames.length < 8 ? (
          <button
            type="button"
            className="mt-2 text-sm text-indigo-300"
            onClick={() => setKidNames([...kidNames, ""])}
          >
            + Add another kid
          </button>
        ) : null}
        <label className="mt-4 block text-sm text-slate-400">Evening shower</label>
        <input
          type="time"
          value={eveningStartTime}
          onChange={(e) => setEveningStartTime(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
        <label className="mt-4 block text-sm text-slate-400">Morning ready</label>
        <input
          type="time"
          value={morningStartTime}
          onChange={(e) => setMorningStartTime(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
      </Card>

      <PrimaryButton disabled={loading} onClick={create}>
        {loading ? "Creating…" : "Create household"}
      </PrimaryButton>

      <Card>
        <p className="text-sm text-slate-400">Already set up?</p>
        <input
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Household ID"
          className="mt-2 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
        <PrimaryButton variant="secondary" onClick={goJoin}>
          Open parent setup
        </PrimaryButton>
      </Card>
    </MobileShell>
  );
}

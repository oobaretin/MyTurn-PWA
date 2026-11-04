"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  FieldLabel,
  MobileShell,
  PrimaryButton,
  SectionTitle,
  TextInput,
} from "./MobileShell";
import { IconShower, IconSunrise } from "./ui/Icons";

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
  const [serverHealth, setServerHealth] = useState<{
    database: string;
    push: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h: { database: string; push: string }) => setServerHealth(h))
      .catch(() => setServerHealth(null));
  }, []);

  function friendlyError(message: string): string {
    if (message.includes("DATABASE_URL")) {
      return "Database not configured. Copy .env.example to .env.local, set DATABASE_URL (Neon/Vercel Postgres), run db/migrate.sql, then restart npm run dev.";
    }
    return message;
  }

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
      const msg = e instanceof Error ? e.message : "Error";
      setError(friendlyError(msg));
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
      title="Fair turns, fewer fights"
      subtitle="Evening showers and morning routines — with reminders on each kid's phone."
      hero={
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-2 py-3 text-center">
            <IconShower className="mb-1 h-6 w-6 text-indigo-300" />
            <span className="text-[10px] font-medium leading-tight text-slate-400">
              Rotate nightly
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-2 py-3 text-center">
            <IconSunrise className="mb-1 h-6 w-6 text-amber-200" />
            <span className="text-[10px] font-medium leading-tight text-slate-400">
              School mornings
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-2 py-3 text-center">
            <span className="mb-1 text-xl" aria-hidden>
              🔔
            </span>
            <span className="text-[10px] font-medium leading-tight text-slate-400">
              Push alerts
            </span>
          </div>
        </div>
      }
    >
      {serverHealth?.database === "missing" ? (
        <Card className="border-amber-500/30 bg-amber-950/25">
          <p className="text-sm font-medium text-amber-100">Setup required</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-200/90">
            Add <code className="text-amber-50">.env.local</code> with{" "}
            <code className="text-amber-50">DATABASE_URL</code>, run{" "}
            <code className="text-amber-50">db/migrate.sql</code>, restart dev
            server.
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-rose-500/30 bg-rose-950/20">
          <p className="text-sm text-rose-200">{error}</p>
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Create your household</SectionTitle>
        <FieldLabel>Family name</FieldLabel>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-4">
          <FieldLabel>Parent PIN (optional)</FieldLabel>
          <TextInput
            type="password"
            inputMode="numeric"
            placeholder="4+ digits"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <FieldLabel>Kids</FieldLabel>
          {kidNames.map((kn, i) => (
            <TextInput
              key={i}
              value={kn}
              onChange={(e) => {
                const next = [...kidNames];
                next[i] = e.target.value;
                setKidNames(next);
              }}
              placeholder={`Kid ${i + 1} name`}
              className="mt-2"
            />
          ))}
          {kidNames.length < 8 ? (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-indigo-300"
              onClick={() => setKidNames([...kidNames, ""])}
            >
              + Add another kid
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Evening shower</FieldLabel>
            <TextInput
              type="time"
              value={eveningStartTime}
              onChange={(e) => setEveningStartTime(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Morning ready</FieldLabel>
            <TextInput
              type="time"
              value={morningStartTime}
              onChange={(e) => setMorningStartTime(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <PrimaryButton disabled={loading} onClick={create}>
        {loading ? "Creating…" : "Get started"}
      </PrimaryButton>

      <Card>
        <SectionTitle>Already set up?</SectionTitle>
        <FieldLabel>Household ID</FieldLabel>
        <TextInput
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Paste ID from parent setup URL"
        />
        <div className="mt-3">
          <PrimaryButton variant="secondary" onClick={goJoin}>
            Open parent setup
          </PrimaryButton>
        </div>
      </Card>
    </MobileShell>
  );
}

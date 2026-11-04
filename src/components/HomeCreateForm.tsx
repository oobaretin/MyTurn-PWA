"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  FieldLabel,
  MobileShell,
  PrimaryButton,
  SectionTitle,
  StickyActionBar,
  TextInput,
} from "./MobileShell";
import { IconShower, IconSunrise } from "./ui/Icons";
import { StatusBanner } from "./ui/StatusBanner";

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
  const [showJoin, setShowJoin] = useState(false);

  function friendlyError(message: string): string {
    if (message.includes("DATABASE_URL")) {
      return process.env.NODE_ENV === "development"
        ? "Database not configured for local dev."
        : "Something went wrong. Please try again.";
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
      subtitle="Evening showers and morning routines, with gentle reminders."
      hero={
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-2 py-3 text-center">
            <IconShower className="mb-1 h-6 w-6 text-indigo-300" />
            <span className="text-[10px] font-medium leading-tight text-slate-400">
              Evening
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-2 py-3 text-center">
            <IconSunrise className="mb-1 h-6 w-6 text-amber-200" />
            <span className="text-[10px] font-medium leading-tight text-slate-400">
              Morning
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/5 px-2 py-3 text-center">
            <span className="mb-1 text-xl" aria-hidden>
              🔔
            </span>
            <span className="text-[10px] font-medium leading-tight text-slate-400">
              Alerts
            </span>
          </div>
        </div>
      }
    >
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

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
            <div key={i} className="mt-2 flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/15"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                aria-hidden
              />
              <TextInput
                value={kn}
                onChange={(e) => {
                  const next = [...kidNames];
                  next[i] = e.target.value;
                  setKidNames(next);
                }}
                placeholder={`Kid ${i + 1}`}
                className="flex-1"
                aria-label={`Kid ${i + 1} name`}
              />
            </div>
          ))}
          {kidNames.length < 8 ? (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-indigo-300"
              onClick={() => setKidNames([...kidNames, ""])}
            >
              + Add kid
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Evening</FieldLabel>
            <TextInput
              type="time"
              value={eveningStartTime}
              onChange={(e) => setEveningStartTime(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Morning</FieldLabel>
            <TextInput
              type="time"
              value={morningStartTime}
              onChange={(e) => setMorningStartTime(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <StickyActionBar>
        <PrimaryButton disabled={loading} loading={loading} onClick={create}>
          {loading ? "Creating…" : "Get started"}
        </PrimaryButton>
      </StickyActionBar>

      <Card className="!p-0 overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-200"
          onClick={() => setShowJoin((v) => !v)}
          aria-expanded={showJoin}
        >
          Returning family
          <span className="text-indigo-300">{showJoin ? "−" : "+"}</span>
        </button>
        {showJoin ? (
          <div className="border-t border-white/10 px-5 pb-5 pt-4">
            <FieldLabel>Household ID</FieldLabel>
            <TextInput
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Paste ID"
            />
            <div className="mt-3">
              <PrimaryButton variant="secondary" onClick={goJoin}>
                Continue
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </Card>
    </MobileShell>
  );
}

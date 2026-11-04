"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, MobileShell, PrimaryButton } from "./MobileShell";

type KidLink = { id: string; name: string; color: string; sharePath: string };

export function SetupView({ householdId }: { householdId: string }) {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [settings, setSettings] = useState<{
    name: string;
    timezone: string;
    eveningStartTime: string;
    morningStartTime: string;
    minutesPerTurn: number;
    schoolDaysOnly: boolean;
    hasPin: boolean;
  } | null>(null);
  const [kids, setKids] = useState<KidLink[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/households/${householdId}/settings`);
    const data = await res.json();
    if (!res.ok) return;
    setAuthed(data.authed);
    setSettings(data.household);
    setKids(data.kids);
  }, [householdId]);

  useEffect(() => {
    load();
  }, [load]);

  async function login() {
    const res = await fetch(`/api/households/${householdId}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      setAuthed(true);
      await load();
    } else {
      setMessage("Wrong PIN");
    }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/households/${householdId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, pin }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved" : "Could not save");
  }

  async function skip(routine: "evening" | "morning") {
    const res = await fetch(`/api/households/${householdId}/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routine, pin }),
    });
    setMessage(res.ok ? "Skipped to next kid" : "Skip failed");
  }

  function copyLink(path: string) {
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url);
    setMessage("Link copied!");
  }

  if (!settings) {
    return (
      <MobileShell title="Setup" subtitle="Loading household…">
        <p className="text-slate-400">Loading…</p>
      </MobileShell>
    );
  }

  if (!authed && settings.hasPin) {
    return (
      <MobileShell title="Parent PIN" subtitle={settings.name}>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="min-h-14 w-full rounded-2xl border border-white/20 bg-black/30 px-4 text-lg text-white"
          placeholder="PIN"
        />
        <PrimaryButton onClick={login}>Unlock</PrimaryButton>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Family setup" subtitle={settings.name}>
      {message ? <p className="text-sm text-indigo-200">{message}</p> : null}

      <Card>
        <label className="block text-sm text-slate-400">Evening shower starts</label>
        <input
          type="time"
          value={settings.eveningStartTime}
          onChange={(e) =>
            setSettings({ ...settings, eveningStartTime: e.target.value })
          }
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
        <label className="mt-4 block text-sm text-slate-400">
          Morning ready starts
        </label>
        <input
          type="time"
          value={settings.morningStartTime}
          onChange={(e) =>
            setSettings({ ...settings, morningStartTime: e.target.value })
          }
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
        <label className="mt-4 block text-sm text-slate-400">
          Minutes per turn
        </label>
        <input
          type="number"
          min={5}
          max={60}
          value={settings.minutesPerTurn}
          onChange={(e) =>
            setSettings({
              ...settings,
              minutesPerTurn: Number(e.target.value),
            })
          }
          className="mt-1 min-h-12 w-full rounded-xl bg-black/30 px-3 text-white"
        />
        <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.schoolDaysOnly}
            onChange={(e) =>
              setSettings({
                ...settings,
                schoolDaysOnly: e.target.checked,
              })
            }
          />
          School days only (Mon–Fri)
        </label>
      </Card>

      <PrimaryButton disabled={saving} onClick={save}>
        Save schedule
      </PrimaryButton>

      <Card>
        <p className="mb-3 font-semibold">Kid links — text these to each child</p>
        <ul className="space-y-3">
          {kids.map((k) => (
            <li key={k.id} className="rounded-xl bg-black/25 p-3">
              <p className="font-medium" style={{ color: k.color }}>
                {k.name}
              </p>
              <button
                type="button"
                className="mt-2 text-sm text-indigo-300 underline"
                onClick={() => copyLink(k.sharePath)}
              >
                Copy link
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-2 font-semibold">Parent controls</p>
        <div className="flex flex-col gap-2">
          <PrimaryButton variant="secondary" onClick={() => skip("morning")}>
            Skip current morning turn
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => skip("evening")}>
            Skip current evening turn
          </PrimaryButton>
        </div>
      </Card>

      <a
        href={`/h/${householdId}/today`}
        className="text-center text-indigo-300 underline"
      >
        View family board
      </a>
    </MobileShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  FieldLabel,
  MobileShell,
  PrimaryButton,
  SectionTitle,
  TextInput,
} from "./MobileShell";
import { KidAvatar } from "./ui/KidAvatar";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";

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
        <LoadingSkeleton />
      </MobileShell>
    );
  }

  if (!authed && settings.hasPin) {
    return (
      <MobileShell title="Parent area" subtitle={settings.name}>
        <Card>
          <FieldLabel>PIN</FieldLabel>
          <TextInput
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter parent PIN"
          />
        </Card>
        <PrimaryButton onClick={login}>Unlock</PrimaryButton>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Family setup" subtitle={settings.name}>
      {message ? (
        <p className="animate-fade-up rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-center text-sm text-indigo-100">
          {message}
        </p>
      ) : null}

      <Card>
        <SectionTitle>Schedule</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Evening start</FieldLabel>
            <TextInput
              type="time"
              value={settings.eveningStartTime}
              onChange={(e) =>
                setSettings({ ...settings, eveningStartTime: e.target.value })
              }
            />
          </div>
          <div>
            <FieldLabel>Morning start</FieldLabel>
            <TextInput
              type="time"
              value={settings.morningStartTime}
              onChange={(e) =>
                setSettings({ ...settings, morningStartTime: e.target.value })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Minutes per turn</FieldLabel>
          <TextInput
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
          />
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-300">
          <input
            type="checkbox"
            className="h-5 w-5 rounded accent-indigo-500"
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
        {saving ? "Saving…" : "Save schedule"}
      </PrimaryButton>

      <Card>
        <SectionTitle>Kid links</SectionTitle>
        <p className="mb-4 text-sm text-slate-400">
          Text each link to your child. They should allow notifications and Add
          to Home Screen.
        </p>
        <ul className="space-y-3">
          {kids.map((k) => (
            <li
              key={k.id}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/25 p-3"
            >
              <KidAvatar name={k.name} color={k.color} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{k.name}</p>
                <button
                  type="button"
                  className="mt-1 text-sm font-medium text-indigo-300"
                  onClick={() => copyLink(k.sharePath)}
                >
                  Copy link →
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="flex flex-col gap-2">
          <PrimaryButton variant="secondary" onClick={() => skip("morning")}>
            Skip morning turn
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => skip("evening")}>
            Skip evening turn
          </PrimaryButton>
        </div>
      </Card>

      <a
        href={`/h/${householdId}/today`}
        className="block text-center text-sm font-medium text-indigo-300 underline-offset-4 hover:underline"
      >
        View family board →
      </a>
    </MobileShell>
  );
}

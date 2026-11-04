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
import { CopyTextButton } from "./ui/CopyTextButton";
import { KidLinkRow } from "./ui/KidLinkRow";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";
import { ParentNav } from "./ui/ParentNav";
import { StatusBanner } from "./ui/StatusBanner";

type KidLink = {
  id: string;
  name: string;
  color: string;
  sharePath: string;
  shareUrl: string;
};

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHouseholdId, setShowHouseholdId] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/households/${householdId}/settings`);
    const data = await res.json();
    if (!res.ok) {
      setLoadError(
        res.status === 404
          ? "Household not found."
          : (data.error ?? "Could not load"),
      );
      setSettings(null);
      setKids([]);
      return;
    }
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

  if (!settings) {
    return (
      <MobileShell title="Settings" subtitle="Loading…">
        {loadError ? (
          <StatusBanner tone="error">{loadError}</StatusBanner>
        ) : (
          <LoadingSkeleton />
        )}
      </MobileShell>
    );
  }

  if (!authed && settings.hasPin) {
    return (
      <MobileShell title="Settings" subtitle={settings.name}>
        <Card>
          <FieldLabel>PIN</FieldLabel>
          <TextInput
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Parent PIN"
          />
        </Card>
        <PrimaryButton onClick={login}>Unlock</PrimaryButton>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Settings" subtitle={settings.name}>
      {message ? (
        <StatusBanner tone="info">{message}</StatusBanner>
      ) : null}

      <Card>
        <SectionTitle>Kids</SectionTitle>
        <ul className="space-y-2">
          {kids.map((k) => (
            <KidLinkRow
              key={k.id}
              name={k.name}
              color={k.color}
              shareUrl={
                k.shareUrl ||
                (typeof window !== "undefined"
                  ? `${window.location.origin}${k.sharePath}`
                  : k.sharePath)
              }
            />
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Schedule</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Evening</FieldLabel>
            <TextInput
              type="time"
              value={settings.eveningStartTime}
              onChange={(e) =>
                setSettings({ ...settings, eveningStartTime: e.target.value })
              }
            />
          </div>
          <div>
            <FieldLabel>Morning</FieldLabel>
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
          School days only
        </label>
      </Card>

      <PrimaryButton disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save changes"}
      </PrimaryButton>

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

      <Card className="!p-0 overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-300"
          onClick={() => setShowHouseholdId((v) => !v)}
          aria-expanded={showHouseholdId}
        >
          Household ID
          <span className="text-indigo-300">{showHouseholdId ? "−" : "+"}</span>
        </button>
        {showHouseholdId ? (
          <div className="border-t border-white/10 px-5 pb-5 pt-3">
            <p className="mb-3 break-all font-mono text-xs text-slate-500">
              {householdId}
            </p>
            <CopyTextButton
              text={householdId}
              label="Copy ID"
              variant="pill"
            />
          </div>
        ) : null}
      </Card>

      <ParentNav householdId={householdId} active="setup" />
    </MobileShell>
  );
}

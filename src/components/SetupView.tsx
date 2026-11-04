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
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/households/${householdId}/settings`);
    const data = await res.json();
    if (!res.ok) {
      setLoadError(
        res.status === 404
          ? "Household not found. Use “Already set up?” on the home page with the correct ID, or create a new family on this site."
          : (data.error ?? "Could not load household"),
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
      <MobileShell title="Setup" subtitle="Loading household…">
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
        <StatusBanner tone="info">{message}</StatusBanner>
      ) : null}

      <Card>
        <SectionTitle>Household ID (parents only)</SectionTitle>
        <p className="mb-2 text-xs leading-relaxed text-slate-500">
          For you or your spouse to rejoin setup —{" "}
          <strong className="text-slate-400">not</strong> the link you text to
          kids (kids need <strong className="text-slate-400">/k/</strong> links
          below).
        </p>
        <p className="mb-2 font-mono text-xs text-slate-400 break-all">
          {householdId}
        </p>
        <CopyTextButton
          text={householdId}
          label="Copy household ID"
          className="text-left"
        />
      </Card>

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
        <p className="mb-4 text-sm leading-relaxed text-slate-400">
          Send the <strong className="text-slate-300">full https:// link</strong>{" "}
          (not just /k/…). On iPhone, use <strong className="text-slate-300">Share…</strong>{" "}
          into Messages. Kids open in Safari, enable alerts, Add to Home Screen.
        </p>
        <ul className="space-y-3">
          {kids.map((k) => (
            <KidLinkRow
              key={k.id}
              name={k.name}
              color={k.color}
              sharePath={k.sharePath}
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

      <ParentNav householdId={householdId} active="setup" />
    </MobileShell>
  );
}

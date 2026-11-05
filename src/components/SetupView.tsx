"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { saveLastHouseholdId } from "@/lib/household-storage";
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

  useEffect(() => {
    saveLastHouseholdId(householdId);
  }, [householdId]);

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

  if (!settings) {
    return (
      <MobileShell title="Settings" subtitle="Loading…">
        {loadError ? (
          <>
            <StatusBanner tone="error">{loadError}</StatusBanner>
            <Link
              href="/"
              className="text-center text-sm font-semibold text-indigo-300"
            >
              Go home
            </Link>
          </>
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
          <FieldLabel>Parent PIN</FieldLabel>
          <TextInput
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Same PIN you set when creating"
          />
        </Card>
        <PrimaryButton onClick={login}>Unlock</PrimaryButton>
        <Link
          href={`/h/${householdId}/today`}
          className="text-center text-sm font-semibold text-slate-400"
        >
          Back to Today
        </Link>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Settings" subtitle={settings.name}>
      {message ? (
        <StatusBanner tone="info">{message}</StatusBanner>
      ) : null}

      <Link
        href={`/h/${householdId}/today`}
        className="text-center text-sm font-semibold text-indigo-300"
      >
        ← Today board
      </Link>

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

      <Card>
        <SectionTitle>Kid links</SectionTitle>
        <p className="mb-3 text-sm text-slate-400">
          Each child opens their link and taps Turn on turn alarms once for
          automatic notifications at their scheduled turn (and when the sibling
          ahead taps Done).
        </p>
        <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/20">
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

      <PrimaryButton disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save changes"}
      </PrimaryButton>

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

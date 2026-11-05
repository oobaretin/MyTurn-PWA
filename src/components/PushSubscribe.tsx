"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function registerForPush() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function PushSubscribe({
  shareToken,
  urgent = false,
  onEnabled,
}: {
  shareToken: string;
  /** Stronger prompt when it's this kid's turn but alerts aren't on yet. */
  urgent?: boolean;
  onEnabled?: () => void;
}) {
  const [status, setStatus] = useState<
    "loading" | "idle" | "unsupported" | "denied" | "ready" | "done"
  >("loading");

  const syncSubscriptionState = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const reg = await registerForPush();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        setStatus("done");
        onEnabled?.();
        return;
      }
    } catch {
      /* registration blocked */
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    void syncSubscriptionState();
  }, [syncSubscriptionState]);

  const subscribe = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const res = await fetch("/api/vapid");
    const { publicKey } = (await res.json()) as { publicKey: string | null };
    if (!publicKey) {
      setStatus("ready");
      return;
    }

    const reg = await registerForPush();
    if (!reg) {
      setStatus("unsupported");
      return;
    }
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = sub.toJSON();
    await fetch(`/api/k/${encodeURIComponent(shareToken)}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    setStatus("done");
    onEnabled?.();
  }, [shareToken, onEnabled]);

  if (status === "loading") {
    return null;
  }

  if (status === "done") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-950/40 py-3 text-center text-sm font-medium text-emerald-100">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-200"
          aria-hidden
        >
          ✓
        </span>
        Turn alarms on — we&apos;ll notify you when it&apos;s your turn
      </p>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="rounded-2xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
        Add this page to your home screen, then turn on alerts (Safari on iPhone).
      </p>
    );
  }

  if (status === "ready") {
    return (
      <p className="rounded-2xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
        Turn alerts aren&apos;t set up on the server yet. Ask a parent to check
        VAPID keys in Vercel.
      </p>
    );
  }

  const buttonClass = urgent
    ? "flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/40 bg-gradient-to-r from-rose-500/20 to-orange-500/20 py-4 text-sm font-bold text-rose-50 shadow-md animate-pulse transition active:scale-[0.99]"
    : "flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-400/35 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 py-3.5 text-sm font-semibold text-indigo-50 shadow-sm transition active:scale-[0.99]";

  return (
    <div className="flex flex-col gap-2">
      {urgent ? (
        <p className="text-center text-sm font-medium text-rose-200/90">
          Turn on alarms so you get a loud nudge when it&apos;s your turn
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          One tap — automatic alarm at your scheduled turn
        </p>
      )}
      <button type="button" onClick={subscribe} className={buttonClass}>
        <span aria-hidden className="text-base">
          🔔
        </span>
        {status === "denied"
          ? "Notifications blocked — open Settings"
          : "Turn on turn alarms"}
      </button>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";

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

export function PushSubscribe({ shareToken }: { shareToken: string }) {
  const [status, setStatus] = useState<
    "idle" | "unsupported" | "denied" | "ready" | "done"
  >("idle");

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

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

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
  }, [shareToken]);

  if (status === "done") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-950/40 py-3 text-center text-sm font-medium text-emerald-100">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-200"
          aria-hidden
        >
          ✓
        </span>
        Turn alerts enabled
      </p>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="rounded-2xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
        Use Safari on iPhone for turn alerts.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-400/35 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 py-3.5 text-sm font-semibold text-indigo-50 shadow-sm transition active:scale-[0.99]"
    >
      <span aria-hidden className="text-base">
        🔔
      </span>
      {status === "denied"
        ? "Notifications blocked — open Settings"
        : "Turn on turn alerts (optional)"}
    </button>
  );
}

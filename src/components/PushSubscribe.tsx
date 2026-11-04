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

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = sub.toJSON();
    await fetch(`/api/k/${shareToken}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    setStatus("done");
  }, [shareToken]);

  useEffect(() => {
    if (Notification.permission === "granted") {
      void subscribe().catch(() => setStatus("ready"));
    }
  }, [subscribe]);

  if (status === "done") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 py-2.5 text-center text-sm text-emerald-200">
        <span aria-hidden>✓</span> Notifications on
      </p>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="rounded-2xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
        Use Safari/Chrome and Add to Home Screen on iPhone for alerts.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      className="w-full rounded-2xl border border-indigo-400/30 bg-indigo-500/10 py-3 text-sm font-semibold text-indigo-100 transition active:bg-indigo-500/20"
    >
      {status === "denied"
        ? "Enable notifications in Settings"
        : "Turn on turn reminders"}
    </button>
  );
}

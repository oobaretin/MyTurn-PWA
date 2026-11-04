"use client";

import { useCallback, useEffect, useState } from "react";
import { PrimaryButton } from "./MobileShell";

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

  if (status === "done") return null;
  if (status === "unsupported") {
    return (
      <p className="text-sm text-amber-200/90">
        Notifications aren&apos;t supported in this browser. Use Chrome/Safari
        and Add to Home Screen on iPhone.
      </p>
    );
  }

  return (
    <PrimaryButton onClick={subscribe}>
      {status === "denied" ? "Enable notifications in Settings" : "Turn on notifications"}
    </PrimaryButton>
  );
}

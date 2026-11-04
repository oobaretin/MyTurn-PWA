"use client";

import { useEffect, useState, type ReactNode } from "react";
import { agentLog } from "@/lib/agent-debug-log";

/**
 * Production was missing /sw.js (Turbopack build). Stale Serwist workers caused
 * Safari to show the offline screen after a brief load. Drop broken registrations.
 */
export function KidSwGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!("serviceWorker" in navigator)) {
        if (!cancelled) setReady(true);
        return;
      }

      let swScriptOk = false;
      try {
        const res = await fetch("/sw.js", { method: "HEAD", cache: "no-store" });
        swScriptOk = res.ok;
      } catch {
        swScriptOk = false;
      }

      const regs = await navigator.serviceWorker.getRegistrations();
      const hadController = Boolean(navigator.serviceWorker.controller);

      if (!swScriptOk && regs.length > 0) {
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter(
                (k) =>
                  k.includes("serwist") ||
                  k === "pages" ||
                  k === "apis" ||
                  k.startsWith("pages-"),
              )
              .map((k) => caches.delete(k)),
          );
        }
      }

      // #region agent log
      agentLog(
        "KidSwGuard",
        "service worker check",
        {
          swScriptOk,
          registrationCount: regs.length,
          hadController,
          clearedBroken: !swScriptOk && regs.length > 0,
          onLine: navigator.onLine,
        },
        "H-SW2",
      );
      // #endregion

      if (!cancelled) setReady(true);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return children;
}

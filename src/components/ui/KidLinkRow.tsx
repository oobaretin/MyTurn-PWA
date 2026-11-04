"use client";

import { useEffect, useState } from "react";
import { CopyTextButton } from "./CopyTextButton";
import { KidAvatar } from "./KidAvatar";

type VerifyState = "checking" | "ok" | "fail";

export function KidLinkRow({
  name,
  color,
  shareUrl,
  sharePath,
}: {
  name: string;
  color: string;
  shareUrl: string;
  sharePath: string;
}) {
  const [verify, setVerify] = useState<VerifyState>("checking");
  const token = sharePath.replace(/^\/k\//, "");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(
          `/api/k/${encodeURIComponent(token)}/state?routine=evening`,
          { cache: "no-store" },
        );
        if (!cancelled) setVerify(res.ok ? "ok" : "fail");
      } catch {
        if (!cancelled) setVerify("fail");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <li className="rounded-2xl border border-white/8 bg-black/25 p-3">
      <div className="flex items-start gap-3">
        <KidAvatar name={name} color={color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{name}</p>
            {verify === "ok" ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Link OK
              </span>
            ) : verify === "fail" ? (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
                Link broken
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Checking…</span>
            )}
          </div>
          <CopyTextButton
            getText={() => shareUrl}
            label="Copy full link"
            disabled={verify === "fail" || !shareUrl.startsWith("http")}
            className="mt-2"
          />
          <p className="mt-2 break-all font-mono text-[11px] leading-snug text-slate-500">
            {shareUrl}
          </p>
          {verify === "fail" ? (
            <p className="mt-2 text-xs leading-relaxed text-rose-300/90">
              This link is not in the live database. Create the household on{" "}
              <strong>my-turn-pwa.vercel.app</strong>, not localhost, then copy
              again.
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

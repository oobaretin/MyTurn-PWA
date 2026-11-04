"use client";

import { useEffect, useState } from "react";
import { agentLog } from "@/lib/agent-debug-log";
import { isPhoneReadyShareUrl, shareUrlHost } from "@/lib/request-origin";
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
  const phoneReady = isPhoneReadyShareUrl(shareUrl);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(
          `/api/k/${encodeURIComponent(token)}/state?routine=evening`,
          { cache: "no-store" },
        );
        if (!cancelled) {
          setVerify(res.ok ? "ok" : "fail");
          // #region agent log
          agentLog(
            "KidLinkRow:verify",
            "link verify finished",
            {
              httpStatus: res.status,
              ok: res.ok,
              shareHost: shareUrlHost(shareUrl),
              phoneReady,
              pathHasK: shareUrl.includes("/k/"),
            },
            "H3",
          );
          // #endregion
        }
      } catch {
        if (!cancelled) setVerify("fail");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [token, shareUrl, phoneReady]);

  return (
    <li className="rounded-2xl border border-white/8 bg-black/25 p-3">
      <div className="flex items-start gap-3">
        <KidAvatar name={name} color={color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{name}</p>
            {verify === "ok" && phoneReady ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Link OK
              </span>
            ) : verify === "ok" && !phoneReady ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                Not for phones
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
            disabled={
              verify === "fail" || !phoneReady || !shareUrl.startsWith("http")
            }
            className="mt-2"
          />
          {phoneReady && verify === "ok" ? (
            <a
              href={shareUrl}
              className="mt-2 inline-block text-sm font-semibold text-slate-300 underline-offset-2 hover:underline"
            >
              Open kid page (test before texting)
            </a>
          ) : null}
          <p className="mt-2 break-all font-mono text-[11px] leading-snug text-slate-500">
            {shareUrl}
          </p>
          {verify === "fail" ? (
            <p className="mt-2 text-xs leading-relaxed text-rose-300/90">
              This link is not in the live database. Create the household on{" "}
              <strong>my-turn-pwa.vercel.app</strong>, not localhost, then copy
              again.
            </p>
          ) : !phoneReady ? (
            <p className="mt-2 text-xs leading-relaxed text-amber-100/90">
              This URL only works on your computer. On your phone, open{" "}
              <strong>https://my-turn-pwa.vercel.app</strong>, go to Family
              setup, then copy or Share the kid link from there.
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

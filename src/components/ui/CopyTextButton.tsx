"use client";

import { useState } from "react";

export function CopyTextButton({
  text,
  getText,
  label,
  copiedLabel = "Copied!",
  className = "",
  disabled = false,
}: {
  /** Static text to copy (ignored if getText is set). */
  text?: string;
  /** Prefer this so copy always uses the current origin (avoids broken SMS links). */
  getText?: () => string;
  label: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function resolveText() {
    const value = (getText ? getText() : text)?.trim() ?? "";
    return value;
  }

  async function copy() {
    const value = resolveText();
    if (!value.startsWith("http")) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  async function share() {
    const value = resolveText();
    if (!value.startsWith("http") || !navigator.share) return;
    try {
      await navigator.share({ url: value, title: "MyTurn kid link" });
    } catch {
      /* user cancelled */
    }
  }

  const ready = resolveText().startsWith("http");

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || !ready}
          onClick={copy}
          className={`text-sm font-semibold transition disabled:opacity-40 ${copied ? "text-emerald-300" : "text-indigo-300 active:opacity-80"}`}
        >
          {copied ? copiedLabel : ready ? label : "Preparing link…"}
        </button>
        {ready && typeof navigator !== "undefined" && "share" in navigator ? (
          <button
            type="button"
            onClick={share}
            className="text-sm font-semibold text-slate-300 active:opacity-80"
          >
            Share…
          </button>
        ) : null}
      </div>
    </div>
  );
}

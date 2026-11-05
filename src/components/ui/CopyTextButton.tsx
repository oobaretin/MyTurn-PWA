"use client";

import { useState } from "react";

export function CopyTextButton({
  text,
  getText,
  label,
  copiedLabel = "Copied",
  className = "",
  disabled = false,
  variant = "text",
}: {
  text?: string;
  getText?: () => string;
  label: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
  variant?: "text" | "pill";
}) {
  const [copied, setCopied] = useState(false);

  function resolveText() {
    return (getText ? getText() : text)?.trim() ?? "";
  }

  async function copy() {
    const value = resolveText();
    if (!value.startsWith("http") && !text) return;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if ("vibrate" in navigator) navigator.vibrate(12);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      if ("vibrate" in navigator) navigator.vibrate(12);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  async function share() {
    const value = resolveText();
    if (!value.startsWith("http") || !navigator.share) return;
    try {
      await navigator.share({ url: value, title: "MyTurn" });
    } catch {
      /* cancelled */
    }
  }

  const value = resolveText();
  const ready = text ? value.length > 0 : value.startsWith("http");

  const pill =
    "rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-40";
  const textBtn =
    "text-sm font-semibold transition disabled:opacity-40 active:opacity-80";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        disabled={disabled || !ready}
        onClick={copy}
        className={
          variant === "pill"
            ? `${pill} ${copied ? "border-emerald-400/40 text-emerald-200" : "text-white"}`
            : `${textBtn} ${copied ? "text-emerald-300" : "text-indigo-300"}`
        }
      >
        {copied ? copiedLabel : label}
      </button>
      {ready &&
      value.startsWith("http") &&
      typeof navigator !== "undefined" &&
      "share" in navigator ? (
        <button
          type="button"
          onClick={share}
          className={
            variant === "pill"
              ? `${pill} text-slate-200`
              : `${textBtn} text-slate-300`
          }
        >
          Share
        </button>
      ) : null}
    </div>
  );
}

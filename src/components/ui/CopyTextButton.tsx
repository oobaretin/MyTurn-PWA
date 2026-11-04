"use client";

import { useState } from "react";

export function CopyTextButton({
  text,
  label,
  copiedLabel = "Copied!",
  className = "",
}: {
  text: string;
  label: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`text-sm font-semibold transition ${copied ? "text-emerald-300" : "text-indigo-300 active:opacity-80"} ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

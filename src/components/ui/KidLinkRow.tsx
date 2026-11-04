"use client";

import { CopyTextButton } from "./CopyTextButton";
import { KidAvatar } from "./KidAvatar";

export function KidLinkRow({
  name,
  color,
  shareUrl,
}: {
  name: string;
  color: string;
  shareUrl: string;
}) {
  const ready = shareUrl.startsWith("https://");

  return (
    <li className="rounded-2xl border border-white/8 bg-black/25 p-3">
      <div className="flex items-start gap-3">
        <KidAvatar name={name} color={color} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{name}</p>
          <CopyTextButton
            getText={() => shareUrl}
            label="Copy link for Messages"
            disabled={!ready}
            className="mt-2"
          />
          <p className="mt-2 break-all font-mono text-[11px] leading-snug text-slate-500">
            {shareUrl}
          </p>
        </div>
      </div>
    </li>
  );
}

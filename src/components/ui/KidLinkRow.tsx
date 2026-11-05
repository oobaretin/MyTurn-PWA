"use client";

import { CopyTextButton } from "./CopyTextButton";
import { KidAvatar } from "./KidAvatar";

export function KidLinkRow({
  name,
  color,
  shareUrl,
  onRemove,
  removing = false,
}: {
  name: string;
  color: string;
  shareUrl: string;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const ready = shareUrl.startsWith("https://");

  return (
    <li className="flex items-center gap-3 px-3 py-3 first:rounded-t-2xl last:rounded-b-2xl">
      <KidAvatar name={name} color={color} size="md" />
      <p className="min-w-0 flex-1 truncate text-base font-medium text-white">
        {name}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <CopyTextButton
          getText={() => shareUrl}
          label="Copy"
          disabled={!ready}
          variant="pill"
        />
        {onRemove ? (
          <button
            type="button"
            disabled={removing}
            onClick={onRemove}
            className="rounded-full border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-200 transition active:scale-[0.98] disabled:opacity-40"
          >
            {removing ? "…" : "Remove"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

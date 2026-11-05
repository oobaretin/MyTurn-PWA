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
    <li className="flex items-center gap-3 px-3 py-3 first:rounded-t-2xl last:rounded-b-2xl">
      <KidAvatar name={name} color={color} size="md" />
      <p className="min-w-0 flex-1 truncate text-base font-medium text-white">
        {name}
      </p>
      <CopyTextButton
        getText={() => shareUrl}
        label="Copy"
        disabled={!ready}
        variant="pill"
      />
    </li>
  );
}

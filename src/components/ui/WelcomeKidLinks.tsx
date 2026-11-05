"use client";

import { Card, SectionTitle } from "../MobileShell";
import { KidLinkRow } from "./KidLinkRow";

export function WelcomeKidLinks({
  kids,
}: {
  kids: { name: string; color: string; shareUrl: string }[];
}) {
  if (kids.length === 0) return null;

  return (
    <Card className="border-indigo-400/25 bg-indigo-500/10">
      <SectionTitle>Send each kid their link</SectionTitle>
      <p className="mb-3 text-sm text-slate-300">
        Tap Copy or Share so they can open MyTurn on their phone.
      </p>
      <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/20">
        {kids.map((k) => (
          <KidLinkRow
            key={k.shareUrl}
            name={k.name}
            color={k.color}
            shareUrl={k.shareUrl}
          />
        ))}
      </ul>
    </Card>
  );
}

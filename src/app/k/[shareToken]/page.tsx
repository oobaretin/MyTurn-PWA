import { KidTurnView } from "@/components/KidTurnView";

export const dynamic = "force-dynamic";

export default async function KidPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ routine?: string }>;
}) {
  const { shareToken: rawToken } = await params;
  const shareToken = decodeURIComponent(rawToken).trim();
  const sp = await searchParams;
  const initialRoutine =
    sp.routine === "morning"
      ? ("morning" as const)
      : sp.routine === "evening"
        ? ("evening" as const)
        : undefined;
  return (
    <KidTurnView shareToken={shareToken} initialRoutine={initialRoutine} />
  );
}

import { KidSwGuard } from "@/components/KidSwGuard";
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
  const routine = sp.routine === "morning" ? "morning" : "evening";
  return (
    <KidSwGuard>
      <KidTurnView shareToken={shareToken} initialRoutine={routine} />
    </KidSwGuard>
  );
}

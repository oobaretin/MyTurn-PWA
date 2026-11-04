import { KidTurnView } from "@/components/KidTurnView";

export const dynamic = "force-dynamic";

export default async function KidPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ routine?: string }>;
}) {
  const { shareToken } = await params;
  const sp = await searchParams;
  const routine = sp.routine === "morning" ? "morning" : "evening";
  return <KidTurnView shareToken={shareToken} initialRoutine={routine} />;
}

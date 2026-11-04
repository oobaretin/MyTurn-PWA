import { AlarmView } from "@/components/AlarmView";
import { KidSwGuard } from "@/components/KidSwGuard";

export const dynamic = "force-dynamic";

export default async function AlarmPage({
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
      <AlarmView shareToken={shareToken} routine={routine} />
    </KidSwGuard>
  );
}

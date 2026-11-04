import { AlarmView } from "@/components/AlarmView";

export const dynamic = "force-dynamic";

export default async function AlarmPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ routine?: string }>;
}) {
  const { shareToken } = await params;
  const sp = await searchParams;
  const routine = sp.routine === "morning" ? "morning" : "evening";
  return <AlarmView shareToken={shareToken} routine={routine} />;
}

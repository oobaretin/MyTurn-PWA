import { TodayBoard } from "@/components/TodayBoard";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  return <TodayBoard householdId={householdId} />;
}

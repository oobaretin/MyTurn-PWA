import { TodayBoard } from "@/components/TodayBoard";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ householdId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { householdId } = await params;
  const sp = await searchParams;
  return (
    <TodayBoard householdId={householdId} welcome={sp.new === "1"} />
  );
}

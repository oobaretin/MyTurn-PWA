import { SetupView } from "@/components/SetupView";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  return <SetupView householdId={householdId} />;
}

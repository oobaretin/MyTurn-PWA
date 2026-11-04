import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getOrCreateDayState } from "@/lib/day-state";
import { currentTurnKidId } from "@/lib/rotation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const db = getDb();
    const [household] = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, id))
      .limit(1);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { dayState, kids } = await getOrCreateDayState(household);

    function routineSnapshot(
      order: string[],
      turnIndex: number,
      label: string,
    ) {
      const currentId = currentTurnKidId(order, turnIndex);
      const current = kids.find((k) => k.id === currentId);
      return {
        label,
        turnIndex,
        current: current
          ? { name: current.name, color: current.color }
          : null,
        order: order.map((kidId) => {
          const k = kids.find((x) => x.id === kidId);
          return k ? { name: k.name, color: k.color } : { name: "?", color: "#888" };
        }),
        complete: turnIndex >= order.length,
      };
    }

    return NextResponse.json({
      household: { name: household.name, date: dayState.date },
      evening: routineSnapshot(
        dayState.eveningOrderKidIds,
        dayState.eveningTurnIndex,
        "Evening shower",
      ),
      morning: routineSnapshot(
        dayState.morningOrderKidIds,
        dayState.morningTurnIndex,
        "Morning ready",
      ),
      eveningFirstRecorded: dayState.eveningFirstKidId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

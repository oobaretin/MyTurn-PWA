import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import {
  buildKidViewState,
  getOrCreateDayState,
  type Routine,
} from "@/lib/day-state";
import { todayInTimezone } from "@/lib/dates";
import { buildOrderSlots } from "@/lib/slot-schedule";
import { normalizeShareToken } from "@/lib/share-token";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await context.params;
  const token = normalizeShareToken(rawToken);
  const url = new URL(request.url);
  const routine = (url.searchParams.get("routine") ?? "evening") as Routine;

  try {
    const db = getDb();
    const [kid] = await db
      .select()
      .from(schema.kids)
      .where(eq(schema.kids.shareToken, token))
      .limit(1);
    if (!kid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [household] = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, kid.householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { dayState, kids } = await getOrCreateDayState(household);
    const view = buildKidViewState(
      kid,
      household,
      dayState,
      kids,
      routine,
    );

    const date = todayInTimezone(household.timezone);
    const order =
      routine === "evening"
        ? dayState.eveningOrderKidIds
        : dayState.morningOrderKidIds;
    const startTime =
      routine === "evening"
        ? household.eveningStartTime
        : household.morningStartTime;
    const slots = buildOrderSlots(
      date,
      startTime,
      order.length,
      household.minutesPerTurn,
      household.timezone,
    );

    const orderWithSlots = view.order.map((k, i) => ({
      ...k,
      ...slots[i]!,
    }));

    const myIndex = order.indexOf(kid.id);
    const mySlot = myIndex >= 0 ? slots[myIndex] : null;

    return NextResponse.json({
      kid: { id: kid.id, name: kid.name, color: kid.color },
      ...view,
      order: orderWithSlots,
      mySlotStartIso: mySlot?.slotStartIso ?? null,
      mySlotLocalTime: mySlot?.slotLocalTime ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

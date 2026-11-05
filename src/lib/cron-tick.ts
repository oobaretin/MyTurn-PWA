import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isSchoolDay, slotStartUtc, todayInTimezone } from "@/lib/dates";
import { getOrCreateDayState } from "@/lib/day-state";
import { currentTurnKidId, routineComplete } from "@/lib/rotation";
import { notifyKidTurnAlarm, type Routine } from "@/lib/turn-notify";

async function maybeNotifyRoutine(
  household: typeof schema.households.$inferSelect,
  dayState: typeof schema.dayStates.$inferSelect,
  routine: Routine,
  now: Date,
) {
  const date = todayInTimezone(household.timezone);
  if (household.schoolDaysOnly && !isSchoolDay(date, household.timezone)) {
    return;
  }

  const order =
    routine === "evening"
      ? dayState.eveningOrderKidIds
      : dayState.morningOrderKidIds;
  const turnIndex =
    routine === "evening"
      ? dayState.eveningTurnIndex
      : dayState.morningTurnIndex;

  if (routineComplete(order, turnIndex)) return;

  const kidId = currentTurnKidId(order, turnIndex);
  if (!kidId) return;

  const startTime =
    routine === "evening"
      ? household.eveningStartTime
      : household.morningStartTime;
  const slotStart = slotStartUtc(
    date,
    startTime,
    turnIndex,
    household.minutesPerTurn,
    household.timezone,
  );

  if (now < slotStart) return;

  const db = getDb();
  const [kid] = await db
    .select()
    .from(schema.kids)
    .where(eq(schema.kids.id, kidId))
    .limit(1);
  if (!kid) return;

  await notifyKidTurnAlarm(dayState.id, routine, turnIndex, kid);
}

export async function runCronTick(): Promise<{ households: number }> {
  const db = getDb();
  const households = await db.select().from(schema.households);
  const now = new Date();

  for (const household of households) {
    const { dayState } = await getOrCreateDayState(household);
    await maybeNotifyRoutine(household, dayState, "morning", now);
    await maybeNotifyRoutine(household, dayState, "evening", now);
  }

  return { households: households.length };
}

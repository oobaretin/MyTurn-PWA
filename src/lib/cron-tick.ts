import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isSchoolDay, slotStartUtc, todayInTimezone } from "@/lib/dates";
import { getOrCreateDayState } from "@/lib/day-state";
import { currentTurnKidId, routineComplete } from "@/lib/rotation";
import { sendPushToKid } from "@/lib/push";

type Routine = "evening" | "morning";

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
  const lastIndex =
    routine === "evening"
      ? dayState.eveningLastNotifiedIndex
      : dayState.morningLastNotifiedIndex;

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
  if (lastIndex >= turnIndex) return;

  const db = getDb();
  const [kid] = await db
    .select()
    .from(schema.kids)
    .where(eq(schema.kids.id, kidId))
    .limit(1);
  if (!kid) return;

  const label = routine === "evening" ? "Shower time" : "Get ready for school";
  await sendPushToKid(kidId, {
    title: `${label}!`,
    body: `${kid.name}, it's your turn.`,
    url: `/k/${kid.shareToken}/alarm?routine=${routine}`,
  });

  const patch =
    routine === "evening"
      ? {
          eveningLastNotifiedIndex: turnIndex,
          eveningLastNotifiedAt: now,
        }
      : {
          morningLastNotifiedIndex: turnIndex,
          morningLastNotifiedAt: now,
        };

  await db
    .update(schema.dayStates)
    .set(patch)
    .where(eq(schema.dayStates.id, dayState.id));
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

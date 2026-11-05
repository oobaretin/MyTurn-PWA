import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DayState, Kid } from "@/db/schema";
import { sendPushToKid } from "@/lib/push";
import { alarmPathForKid } from "@/lib/request-origin";

export type Routine = "evening" | "morning";

function lastNotifiedIndex(dayState: DayState, routine: Routine): number {
  return routine === "evening"
    ? dayState.eveningLastNotifiedIndex
    : dayState.morningLastNotifiedIndex;
}

/** Sends push (full-screen alarm URL) and marks this turn index as notified. */
export async function notifyKidTurnAlarm(
  dayStateId: string,
  routine: Routine,
  turnIndex: number,
  kid: Pick<Kid, "id" | "name" | "shareToken">,
): Promise<boolean> {
  const db = getDb();
  const [fresh] = await db
    .select()
    .from(schema.dayStates)
    .where(eq(schema.dayStates.id, dayStateId))
    .limit(1);
  if (!fresh) return false;

  if (lastNotifiedIndex(fresh, routine) >= turnIndex) {
    return false;
  }

  const label = routine === "evening" ? "Shower time" : "Get ready for school";
  const url = alarmPathForKid(kid.shareToken, routine);

  await sendPushToKid(kid.id, {
    title: `${label}!`,
    body: `${kid.name}, it's your turn.`,
    url,
  });

  const now = new Date();
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
    .where(eq(schema.dayStates.id, dayStateId));

  return true;
}

import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DayState, Household, Kid } from "@/db/schema";
import { todayInTimezone, yesterdayDate } from "@/lib/dates";
import {
  computeEveningOrder,
  computeMorningOrder,
  currentTurnKidId,
  routineComplete,
} from "@/lib/rotation";
import { sendPushToKid } from "@/lib/push";

export type Routine = "evening" | "morning";

export async function getKidsForHousehold(householdId: string): Promise<Kid[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.kids)
    .where(eq(schema.kids.householdId, householdId))
    .orderBy(asc(schema.kids.sortOrder));
}

export function baseKidOrder(kids: Kid[]): string[] {
  return kids.map((k) => k.id);
}

async function bumpDayOffsetIfNewDay(
  household: Household,
  today: string,
): Promise<Household> {
  if (household.lastActiveDate === today) {
    return household;
  }
  const db = getDb();
  let dayOffset = household.dayOffset;
  if (household.lastActiveDate) {
    dayOffset += 1;
  }
  const [updated] = await db
    .update(schema.households)
    .set({ dayOffset, lastActiveDate: today })
    .where(eq(schema.households.id, household.id))
    .returning();
  return updated ?? { ...household, dayOffset, lastActiveDate: today };
}

export async function getOrCreateDayState(
  household: Household,
): Promise<{ household: Household; dayState: DayState; kids: Kid[] }> {
  const db = getDb();
  const kids = await getKidsForHousehold(household.id);
  const baseOrder = baseKidOrder(kids);
  const today = todayInTimezone(household.timezone);
  const householdFresh = await bumpDayOffsetIfNewDay(household, today);

  const existing = await db
    .select()
    .from(schema.dayStates)
    .where(
      and(
        eq(schema.dayStates.householdId, household.id),
        eq(schema.dayStates.date, today),
      ),
    )
    .limit(1);

  if (existing[0]) {
    return { household: householdFresh, dayState: existing[0], kids };
  }

  const yesterday = yesterdayDate(today);
  const yesterdayState = await db
    .select()
    .from(schema.dayStates)
    .where(
      and(
        eq(schema.dayStates.householdId, household.id),
        eq(schema.dayStates.date, yesterday),
      ),
    )
    .limit(1);

  const eveningOrder = computeEveningOrder(
    baseOrder,
    householdFresh.dayOffset,
  );
  const morningOrder = computeMorningOrder(
    baseOrder,
    yesterdayState[0]?.eveningFirstKidId ?? null,
    eveningOrder,
  );

  const [created] = await db
    .insert(schema.dayStates)
    .values({
      householdId: household.id,
      date: today,
      eveningOrderKidIds: eveningOrder,
      morningOrderKidIds: morningOrder,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create day state");
  }
  return { household: householdFresh, dayState: created, kids };
}

function routineFields(routine: Routine) {
  if (routine === "evening") {
    return {
      orderKey: "eveningOrderKidIds" as const,
      turnKey: "eveningTurnIndex" as const,
      startedKey: "eveningStarted" as const,
      firstKidKey: "eveningFirstKidId" as const,
    };
  }
  return {
    orderKey: "morningOrderKidIds" as const,
    turnKey: "morningTurnIndex" as const,
    startedKey: "morningStarted" as const,
    firstKidKey: null,
  };
}

export async function performTurnAction(
  kid: Kid,
  household: Household,
  dayState: DayState,
  routine: Routine,
  action: "start" | "done" | "skip",
): Promise<DayState> {
  const db = getDb();
  const fields = routineFields(routine);
  const order = dayState[fields.orderKey];
  const turnIndex = dayState[fields.turnKey];
  const currentId = currentTurnKidId(order, turnIndex);

  if (action !== "skip" && currentId && currentId !== kid.id) {
    throw new Error("Not your turn");
  }

  const updates: Partial<DayState> = {};

  if (action === "start") {
    updates[fields.startedKey] = true;
    if (fields.firstKidKey && turnIndex === 0 && !dayState.eveningFirstKidId) {
      updates.eveningFirstKidId = kid.id;
    }
  }

  if (action === "done" || action === "skip") {
    updates[fields.turnKey] = turnIndex + 1;
    if (action === "done" && !dayState[fields.startedKey]) {
      updates[fields.startedKey] = true;
      if (
        fields.firstKidKey &&
        turnIndex === 0 &&
        !dayState.eveningFirstKidId
      ) {
        updates.eveningFirstKidId = kid.id;
      }
    }
  }

  const [updated] = await db
    .update(schema.dayStates)
    .set(updates)
    .where(eq(schema.dayStates.id, dayState.id))
    .returning();

  if (!updated) throw new Error("Update failed");

  const nextIndex = updated[fields.turnKey];
  const nextKidId = currentTurnKidId(order, nextIndex);
  if (
    nextKidId &&
    !routineComplete(order, nextIndex) &&
    (action === "done" || action === "skip")
  ) {
    const nextKid = await db
      .select()
      .from(schema.kids)
      .where(eq(schema.kids.id, nextKidId))
      .limit(1);
    const name = nextKid[0]?.name ?? "Your turn";
    const label = routine === "evening" ? "Shower time" : "Get ready";
    await sendPushToKid(nextKidId, {
      title: `${label}!`,
      body: `${name}, it's your turn.`,
      url: `/k/${nextKid[0]?.shareToken ?? ""}/alarm?routine=${routine}`,
    });
  }

  return updated;
}

export function buildKidViewState(
  kid: Kid,
  household: Household,
  dayState: DayState,
  kids: Kid[],
  routine: Routine,
) {
  const fields = routineFields(routine);
  const order = dayState[fields.orderKey];
  const turnIndex = dayState[fields.turnKey];
  const currentId = currentTurnKidId(order, turnIndex);
  const currentKid = kids.find((k) => k.id === currentId);
  const complete = routineComplete(order, turnIndex);
  const isMyTurn = currentId === kid.id && !complete;

  return {
    routine,
    isMyTurn,
    complete,
    currentKid: currentKid
      ? { id: currentKid.id, name: currentKid.name, color: currentKid.color }
      : null,
    turnIndex,
    order: order.map((id) => {
      const k = kids.find((x) => x.id === id);
      return k
        ? { id: k.id, name: k.name, color: k.color }
        : { id, name: "?", color: "#888" };
    }),
    started: dayState[fields.startedKey],
    household: {
      eveningStartTime: household.eveningStartTime,
      morningStartTime: household.morningStartTime,
      minutesPerTurn: household.minutesPerTurn,
      timezone: household.timezone,
    },
  };
}

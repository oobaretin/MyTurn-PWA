import type { DayState, Household } from "@/db/schema";
import type { Routine } from "@/lib/day-state";
import { slotStartUtc, todayInTimezone } from "./dates.ts";
import { routineComplete } from "./rotation.ts";

function routineStartUtc(
  date: string,
  startTime: string,
  timezone: string,
): Date {
  return slotStartUtc(date, startTime, 0, 1, timezone);
}

/**
 * Which routine the kid/parent UI should focus on: the one in progress or
 * the next scheduled block (e.g. before 6:30 AM → morning, not evening).
 */
export function inferActiveRoutine(
  household: Pick<
    Household,
    "timezone" | "eveningStartTime" | "morningStartTime"
  >,
  dayState: DayState,
  now = new Date(),
): Routine {
  const today = todayInTimezone(household.timezone);
  const morningStart = routineStartUtc(
    today,
    household.morningStartTime,
    household.timezone,
  );
  const eveningStart = routineStartUtc(
    today,
    household.eveningStartTime,
    household.timezone,
  );

  const morningIncomplete = !routineComplete(
    dayState.morningOrderKidIds,
    dayState.morningTurnIndex,
  );
  const eveningIncomplete = !routineComplete(
    dayState.eveningOrderKidIds,
    dayState.eveningTurnIndex,
  );

  const t = now.getTime();

  if (t < morningStart.getTime()) {
    if (morningIncomplete) return "morning";
    if (eveningIncomplete) return "evening";
    return "morning";
  }

  if (t < eveningStart.getTime()) {
    if (morningIncomplete) return "morning";
    if (eveningIncomplete) return "evening";
    return "evening";
  }

  if (eveningIncomplete) return "evening";
  if (morningIncomplete) return "morning";

  return "morning";
}

export function parseRoutineParam(
  value: string | null,
): Routine | "auto" {
  if (value === "morning" || value === "evening") return value;
  return "auto";
}

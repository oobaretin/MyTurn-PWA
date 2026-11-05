import type { DayState } from "@/db/schema";

export function removeKidFromRoutineOrder(
  order: string[],
  turnIndex: number,
  kidId: string,
): { order: string[]; turnIndex: number } {
  const idx = order.indexOf(kidId);
  if (idx < 0) return { order, turnIndex };

  const nextOrder = order.filter((id) => id !== kidId);
  let nextTurnIndex = turnIndex;
  if (idx < turnIndex) {
    nextTurnIndex = Math.max(0, turnIndex - 1);
  }
  nextTurnIndex = Math.min(nextTurnIndex, nextOrder.length);
  return { order: nextOrder, turnIndex: nextTurnIndex };
}

export function patchDayStateAfterKidRemoved(
  dayState: DayState,
  kidId: string,
): Partial<DayState> {
  const evening = removeKidFromRoutineOrder(
    dayState.eveningOrderKidIds,
    dayState.eveningTurnIndex,
    kidId,
  );
  const morning = removeKidFromRoutineOrder(
    dayState.morningOrderKidIds,
    dayState.morningTurnIndex,
    kidId,
  );

  const patch: Partial<DayState> = {
    eveningOrderKidIds: evening.order,
    eveningTurnIndex: evening.turnIndex,
    morningOrderKidIds: morning.order,
    morningTurnIndex: morning.turnIndex,
  };

  if (dayState.eveningFirstKidId === kidId) {
    patch.eveningFirstKidId = null;
  }

  return patch;
}

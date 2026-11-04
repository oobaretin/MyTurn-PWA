/** Rotate array so element at index `offset` becomes first. */
export function rotate<T>(items: readonly T[], offset: number): T[] {
  if (items.length === 0) return [];
  const n = items.length;
  const o = ((offset % n) + n) % n;
  return [...items.slice(o), ...items.slice(0, o)];
}

export function rotateToFront<T>(
  items: readonly T[],
  frontItem: T | null | undefined,
): T[] {
  if (!frontItem || items.length === 0) return [...items];
  const idx = items.indexOf(frontItem);
  if (idx === -1) return [...items];
  return rotate(items, idx);
}

export function computeEveningOrder(
  baseOrder: readonly string[],
  dayOffset: number,
): string[] {
  return rotate(baseOrder, dayOffset);
}

export function computeMorningOrder(
  baseOrder: readonly string[],
  yesterdayEveningFirstKidId: string | null | undefined,
  fallbackEveningOrder: readonly string[],
): string[] {
  if (yesterdayEveningFirstKidId) {
    return rotateToFront(baseOrder, yesterdayEveningFirstKidId);
  }
  return [...fallbackEveningOrder];
}

export function currentTurnKidId(
  order: readonly string[],
  turnIndex: number,
): string | null {
  if (turnIndex < 0 || turnIndex >= order.length) return null;
  return order[turnIndex] ?? null;
}

export function routineComplete(
  order: readonly string[],
  turnIndex: number,
): boolean {
  return order.length === 0 || turnIndex >= order.length;
}

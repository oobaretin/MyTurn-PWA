import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeEveningOrder,
  computeMorningOrder,
  currentTurnKidId,
  rotate,
  rotateToFront,
  routineComplete,
} from "./rotation.ts";

describe("rotate", () => {
  it("rotates by offset", () => {
    assert.deepEqual(rotate(["A", "B", "C"], 1), ["B", "C", "A"]);
    assert.deepEqual(rotate(["A", "B", "C"], -1), ["C", "A", "B"]);
  });
});

describe("rotateToFront", () => {
  it("puts target first", () => {
    assert.deepEqual(rotateToFront(["A", "B", "C"], "B"), ["B", "C", "A"]);
  });
});

describe("computeEveningOrder", () => {
  it("uses day offset", () => {
    const base = ["k1", "k2", "k3"];
    assert.deepEqual(computeEveningOrder(base, 0), ["k1", "k2", "k3"]);
    assert.deepEqual(computeEveningOrder(base, 1), ["k2", "k3", "k1"]);
  });
});

describe("computeMorningOrder", () => {
  it("starts with yesterday evening first bather", () => {
    const base = ["k1", "k2", "k3"];
    assert.deepEqual(computeMorningOrder(base, "k2", base), [
      "k2",
      "k3",
      "k1",
    ]);
  });

  it("falls back to evening order when no yesterday record", () => {
    const base = ["k1", "k2"];
    const evening = ["k2", "k1"];
    assert.deepEqual(computeMorningOrder(base, null, evening), evening);
  });
});

describe("turn helpers", () => {
  it("currentTurnKidId and routineComplete", () => {
    const order = ["a", "b"];
    assert.equal(currentTurnKidId(order, 0), "a");
    assert.equal(currentTurnKidId(order, 2), null);
    assert.equal(routineComplete(order, 2), true);
    assert.equal(routineComplete(order, 1), false);
  });
});

/** Mirrors getOrCreateDayState order rules (base sort = Child A, B, …). */
function ordersForDay(
  base: string[],
  dayOffset: number,
  yesterdayEveningFirst: string | null,
) {
  const eveningOrder = computeEveningOrder(base, dayOffset);
  const morningOrder = computeMorningOrder(
    base,
    yesterdayEveningFirst,
    eveningOrder,
  );
  return { eveningOrder, morningOrder };
}

describe("family rotation scenario (Child A first in setup)", () => {
  const A = "child-a";
  const B = "child-b";
  const base = [A, B];

  it("night 1: A first shower; same calendar morning already had A first", () => {
    const { eveningOrder, morningOrder } = ordersForDay(base, 0, null);
    assert.deepEqual(eveningOrder, [A, B]);
    assert.deepEqual(morningOrder, [A, B]);
    assert.equal(currentTurnKidId(eveningOrder, 0), A);
    assert.equal(currentTurnKidId(morningOrder, 0), A);
  });

  it("day 2: evening rotates; morning leads with whoever showered first last night", () => {
    const { eveningOrder, morningOrder } = ordersForDay(base, 1, A);
    assert.deepEqual(eveningOrder, [B, A]);
    assert.deepEqual(morningOrder, [A, B]);
    assert.equal(currentTurnKidId(eveningOrder, 0), B);
    assert.equal(currentTurnKidId(morningOrder, 0), A);
  });

  it("day 3: evening rotates again; morning follows new yesterday-first", () => {
    const { eveningOrder, morningOrder } = ordersForDay(base, 2, B);
    assert.deepEqual(eveningOrder, [A, B]);
    assert.deepEqual(morningOrder, [B, A]);
  });
});

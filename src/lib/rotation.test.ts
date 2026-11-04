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

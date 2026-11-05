import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { removeKidFromRoutineOrder } from "./day-state-kid-remove.ts";

describe("removeKidFromRoutineOrder", () => {
  it("drops kid and adjusts turn index when removing someone before current", () => {
    const r = removeKidFromRoutineOrder(["a", "b", "c"], 2, "a");
    assert.deepEqual(r.order, ["b", "c"]);
    assert.equal(r.turnIndex, 1);
  });

  it("keeps turn index when removing someone after current", () => {
    const r = removeKidFromRoutineOrder(["a", "b", "c"], 0, "c");
    assert.deepEqual(r.order, ["a", "b"]);
    assert.equal(r.turnIndex, 0);
  });
});

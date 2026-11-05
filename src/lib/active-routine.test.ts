import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferActiveRoutine } from "./active-routine.ts";
function dayState(partial: Record<string, unknown> = {}) {
  return {
    id: "d",
    householdId: "h",
    date: "2026-03-04",
    eveningFirstKidId: null,
    eveningOrderKidIds: ["a", "b"],
    morningOrderKidIds: ["a", "b"],
    eveningTurnIndex: 0,
    morningTurnIndex: 0,
    eveningStarted: false,
    morningStarted: false,
    eveningLastNotifiedAt: null,
    morningLastNotifiedAt: null,
    eveningLastNotifiedIndex: -1,
    morningLastNotifiedIndex: -1,
    ...partial,
  };
}

const household = {
  timezone: "America/Chicago",
  morningStartTime: "06:30",
  eveningStartTime: "19:30",
};

describe("inferActiveRoutine", () => {
  it("before morning start chooses morning (not evening)", () => {
    const at2am = new Date("2026-03-04T08:00:00.000Z");
    assert.equal(
      inferActiveRoutine(household, dayState(), at2am),
      "morning",
    );
  });

  it("midday with morning incomplete chooses morning", () => {
    const noon = new Date("2026-03-04T18:00:00.000Z");
    assert.equal(
      inferActiveRoutine(household, dayState(), noon),
      "morning",
    );
  });

  it("after evening start chooses evening when incomplete", () => {
    const night = new Date("2026-03-05T02:30:00.000Z");
    assert.equal(
      inferActiveRoutine(
        household,
        dayState({ morningTurnIndex: 2 }),
        night,
      ),
      "evening",
    );
  });
});

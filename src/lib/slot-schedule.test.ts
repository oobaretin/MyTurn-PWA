import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slotStartUtc } from "./dates.ts";
import { msUntil, turnWaitPhase } from "./countdown-format.ts";

describe("scheduled turn slots", () => {
  it("stagger slots by minutesPerTurn per kid index", () => {
    const a = slotStartUtc("2026-03-04", "19:30", 0, 15, "America/Chicago");
    const b = slotStartUtc("2026-03-04", "19:30", 1, 15, "America/Chicago");
    assert.equal(b.getTime() - a.getTime(), 15 * 60_000);
  });
});

describe("turnWaitPhase", () => {
  it("counts down only for the kid first in line before slot time", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    assert.equal(turnWaitPhase(0, 0, false, future), "countdown");
    assert.equal(turnWaitPhase(1, 0, false, future), "up-next");
    assert.equal(turnWaitPhase(0, 0, false, new Date(Date.now() - 1000).toISOString()), "now");
  });
});

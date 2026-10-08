import { describe, expect, it } from "vitest";
import { ALL_ACTIONS } from "@app/common";
import { ActionToName, clamp, isAbortError } from "./helpers";

describe("clamp (score limits)", () => {
  // Signature is (value, max, min)
  it.each([
    [2, 3, 0, 2],
    [0, 3, 0, 0], // at min
    [3, 3, 0, 3], // at max
    [-1, 3, 0, 0], // below min clamps up
    [4, 3, 0, 3], // above max clamps down
  ])("value %i with max %i, min %i -> %i", (value, max, min, expected) => {
    expect(clamp(value, max, min)).toBe(expected);
  });

  it("passes NaN through instead of clamping it", () => {
    expect(clamp(Number.NaN, 3, 0)).toBeNaN();
  });
});

describe("isAbortError", () => {
  it("recognizes a DOMException AbortError", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
  });

  it("recognizes any error-like object named AbortError", () => {
    expect(isAbortError({ name: "AbortError" })).toBe(true);
  });

  it.each([new Error("network"), new DOMException("x", "TimeoutError"), null, undefined, "AbortError"])(
    "rejects %s",
    (value) => {
      expect(isAbortError(value)).toBe(false);
    },
  );
});

describe("ActionToName (labels on the Shortcuts settings page)", () => {
  it("has a label for every shortcut action", () => {
    for (const action of ALL_ACTIONS) {
      expect(ActionToName[action], action).toBeTruthy();
    }
  });

  const sideActions = ALL_ACTIONS.filter((a) => a.startsWith("team-left") || a.startsWith("team-right"));
  const BUGGY = "team-right-score-down";

  it.each(sideActions.filter((a) => a !== BUGGY))("%s label names the correct side", (action) => {
    const side = action.startsWith("team-left") ? "left" : "right";
    expect(ActionToName[action].toLowerCase()).toContain(side);
  });

  /**
   * KNOWN BUG (copy-paste): "team-right-score-down" is labeled "Decrease left team's score by 1",
   * so the Shortcuts page shows two identical "left" entries. `it.fails` passes while the bug
   * exists and turns red once it's fixed; then change it to a normal `it`.
   */
  describe("known bugs", () => {
    it.fails(`BUG: ${BUGGY} label names the right side`, () => {
      expect(ActionToName[BUGGY].toLowerCase()).toContain("right");
    });

    it.fails("BUG: labels are unique, so two shortcuts never look the same in settings", () => {
      const labels = Object.values(ActionToName);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });
});

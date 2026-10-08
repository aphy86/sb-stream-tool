import { describe, expect, it } from "vitest";
import {
  ALL_ACTIONS,
  DEFAULT_SHORTCUTS,
  GLOBAL_ACTIONS,
  isGlobalAction,
  isSafeGlobalHotkey,
} from "./shortcut";

/**
 * Global hotkeys work even when the stream tool isn't focused (e.g. while OBS or the game is).
 * A global hotkey without a modifier would steal that key from every other app, so global
 * hotkeys must include Control/Alt/Meta/Mod, or be a function key (F1-F24).
 */
describe("isSafeGlobalHotkey", () => {
  it.each(["Control+ArrowUp", "Alt+1", "Meta+k", "Mod+s", "Control+Alt+Delete", "Shift+Alt+a"])(
    "allows %s (has a modifier)",
    (hotkey) => {
      expect(isSafeGlobalHotkey(hotkey)).toBe(true);
    },
  );

  it.each(["F1", "F12", "F13", "F24", "Shift+F5"])("allows %s (function key)", (hotkey) => {
    expect(isSafeGlobalHotkey(hotkey)).toBe(true);
  });

  it.each([
    "a",
    "Enter",
    "Escape",
    "ArrowUp",
    "Shift+a", // Shift alone would still steal typed capital letters
    "F0",
    "F25",
    "F1a",
    "XF12", // must be exactly a function key, not a key whose name ends in F12
    "",
  ])("rejects %j", (hotkey) => {
    expect(isSafeGlobalHotkey(hotkey)).toBe(false);
  });
});

describe("isGlobalAction", () => {
  it("is true for OBS and per-team score actions", () => {
    expect(isGlobalAction("obs-disconnect")).toBe(true);
    expect(isGlobalAction("team-left-score-up")).toBe(true);
  });

  it("is false for actions that only make sense inside the app", () => {
    expect(isGlobalAction("submit")).toBe(false);
    expect(isGlobalAction("home")).toBe(false);
    expect(isGlobalAction("score-up-local")).toBe(false);
  });
});

describe("DEFAULT_SHORTCUTS (what a fresh install ships with)", () => {
  it("has exactly one default for every action", () => {
    const actions = DEFAULT_SHORTCUTS.map((s) => s.action);
    expect([...actions].sort()).toEqual([...ALL_ACTIONS].sort());
  });

  it("never binds the same hotkey to two actions", () => {
    const hotkeys = DEFAULT_SHORTCUTS.map((s) => s.hotkey);
    expect(new Set(hotkeys).size).toBe(hotkeys.length);
  });

  // Out of the box, global defaults must not break other apps' shortcuts.
  it.each(GLOBAL_ACTIONS)("default hotkey for global action %s is safe", (action) => {
    const shortcut = DEFAULT_SHORTCUTS.find((s) => s.action === action);
    expect(shortcut, `no default for ${action}`).toBeDefined();
    expect(isSafeGlobalHotkey(shortcut!.hotkey), shortcut!.hotkey).toBe(true);
  });
});

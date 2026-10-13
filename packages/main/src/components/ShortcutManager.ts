import {
  DEFAULT_SHORTCUTS,
  isGlobalAction,
  ShortcutSettings,
} from "@app/common";
import { globalShortcut } from "electron";
import { EventStream } from "./EventStream.js";
import { SettingsStore } from "./SettingsStore.js";
import { Mutex } from "es-toolkit";

const KEY_MAP: Record<string, string> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Mod: "CommandOrControl",
  " ": "Space",
};
/**
 * A handler for global + local shortcuts, allows truly global shortcuts to be added via ipc calls
 */
export class ShortcutManager {
  private static shortcuts: ShortcutSettings = [];
  private static suspended = false;
  private static shortcutsMutex = new Mutex();

  static async init() {
    const savedShortcuts = await SettingsStore.getShortcuts();
    this.register(this.merge(DEFAULT_SHORTCUTS, savedShortcuts));
  }

  private static toAccelerator(hotkey: string) {
    // Electron stores + as "Plus", so we have to account for that
    const endsWithPlus = hotkey === "+" || hotkey.endsWith("++");
    const keyCombo = endsWithPlus
      ? [...hotkey.slice(0, -1).split("+").filter(Boolean), "Plus"]
      : hotkey.split("+");
    return keyCombo
      .map(
        (key) => KEY_MAP[key] ?? (key.length === 1 ? key.toUpperCase() : key),
      )
      .join("+");
  }

  static getShortcuts() {
    return this.shortcuts;
  }

  /**
   * merge undefined shortcuts with a base set keys, so all shortcuts are handled
   */
  private static merge(
    base: ShortcutSettings,
    changed?: ShortcutSettings,
  ): ShortcutSettings {
    const merged = new Map(base.map((s) => [s.action, s.hotkey]));
    changed?.forEach((s) => merged.set(s.action, s.hotkey));
    return Array.from(merged, ([action, hotkey]) => ({ action, hotkey }));
  }

  private static register(newShortcuts: ShortcutSettings) {
    this.shortcuts = newShortcuts;
    globalShortcut.unregisterAll();
    const failedShortcuts = [];
    for (const { action, hotkey } of newShortcuts) {
      if (isGlobalAction(action) && hotkey !== "") {
        try {
          if (
            !globalShortcut.register(this.toAccelerator(hotkey), () =>
              EventStream.notify("global-shortcut", action),
            )
          ) {
            failedShortcuts.push(hotkey);
          }
        } catch {
          failedShortcuts.push(hotkey);
        }
      }
    }
    if (failedShortcuts.length > 0) {
      EventStream.notify(
        "toast",
        "Shortcuts",
        `Couldn't register: ${failedShortcuts.join(", ")}`,
      );
    }

    if (this.suspended) {
      globalShortcut.unregisterAll();
    }
  }

  /**
   * saves shortcuts, then returns the saved shortcuts back
   */
  static async save(newShortcuts: ShortcutSettings) {
    await this.shortcutsMutex.acquire();
    try {
      const shortcuts = this.merge(this.shortcuts, newShortcuts);
      await SettingsStore.writeShortcutSettings(shortcuts);
      this.register(shortcuts);
      return shortcuts;
    } finally {
      this.shortcutsMutex.release();
    }
  }

  /**
   * release all global keys so that hotkeys can be recorded in renderer
   */
  static suspendGlobalKeys() {
    this.suspended = true;
    globalShortcut.unregisterAll();
  }

  static resumeGlobalKeys() {
    if (this.suspended) {
      this.suspended = false;
      this.register(this.shortcuts);
    }
  }

  static clear() {
    globalShortcut.unregisterAll();
  }
}

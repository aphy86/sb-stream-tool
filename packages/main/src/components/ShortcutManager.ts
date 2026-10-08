import {
  Action,
  DEFAULT_SHORTCUTS,
  isGlobalAction,
  ShortcutSettings,
} from "@app/common";
import { BrowserWindow, globalShortcut } from "electron";
import { EventStream } from "./EventStream.js";
import { SettingsStore } from "./SettingsStore.js";

/**
 * A handler for global + local shortcuts, allows truly global shortcuts to be added via ipc calls
 */
export class ShortcutManager {
  private static browserWindow: BrowserWindow | null = null;
  private static shortcuts: ShortcutSettings = [];
  private static suspended = false;
  private static keyMap: Record<string, string> = {
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Mod: "CommandOrControl",
    " ": "Space",
  };

  static async init() {
    const savedShortcuts = await SettingsStore.getShortcuts();
    this.register(this.merge(DEFAULT_SHORTCUTS, savedShortcuts));
  }

  private static toAccelerator(hotkey: string) {
    return hotkey
      .split("+")
      .map(
        (key) =>
          this.keyMap[key] ?? (key.length === 1 ? key.toUpperCase() : key),
      )
      .join("+");
  }

  static setBrowserWindow(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  static getShortcuts() {
    return this.shortcuts;
  }

  private static forward(action: Action) {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.webContents.send("shortcut/global-event", action);
    }
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
              this.forward(action),
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
   *
   * saves shortcuts, then returns the saved shortcuts back
   */
  static async save(newShortcuts: ShortcutSettings) {
    const shortcuts = this.merge(this.shortcuts, newShortcuts);
    await SettingsStore.writeShortcutSettings(shortcuts);
    this.register(shortcuts);
    return shortcuts;
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

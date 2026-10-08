import { Hotkey } from "@tanstack/react-hotkeys";
import { StoreSliceType } from "./slice";
import { StateCreator } from "zustand";
import { Action, DEFAULT_SHORTCUTS, ShortcutSettings } from "@app/common";
import { send } from "@app/preload";

type Shortcuts = Map<Action, Hotkey>;

export type Shortcut = { action: Action; hotkey: Hotkey };

export const toShortcutMap = (shortcuts: ShortcutSettings) =>
  new Map(shortcuts.map(({ action, hotkey }) => [action, hotkey as Hotkey]));

export type ShortcutsSlice = {
  shortcuts: Shortcuts;
  updateKeys: (newShortcuts: Map<Action, Hotkey>) => Promise<void>;
};

export const defaultShortcuts = toShortcutMap(DEFAULT_SHORTCUTS);

export const createShortcutsSlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  ShortcutsSlice
> = (set) => ({
  shortcuts: defaultShortcuts,
  // newShortcuts will always include every shortcut
  updateKeys: async (newShortcuts) => {
    const newShortcutSettings = Array.from(
      newShortcuts,
      ([action, hotkey]) => ({ action, hotkey }),
    ) as ShortcutSettings;
    const saved: ShortcutSettings = await send(
      "shortcuts/save-shortcuts",
      newShortcutSettings,
    ).catch(console.error);

    set((state) => {
      state.shortcuts = toShortcutMap(saved);
    });
  },
});

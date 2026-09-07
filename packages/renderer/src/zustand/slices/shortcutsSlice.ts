import { Hotkey } from "@tanstack/react-hotkeys";
import { StoreSliceType } from "./slice";
import { StateCreator } from "zustand";
import { Action, ShortcutSettings } from "@app/common";
import { send } from "@app/preload";
import { useSettingsStore } from "../store";

type Shortcuts = Map<Action, Hotkey>;

export type Shortcut = { action: Action; hotkey: Hotkey };

export type ShortcutsSlice = {
  shortcuts: Shortcuts;
  updateKeys: (newShortcuts: Map<Action, Hotkey>) => void;
  resetShortcutsToDefault: () => void;
};

export const defaultShortcuts = new Map<Action, Hotkey>([
  ["home", "Escape"],
  ["submit", "Enter"],
  ["score-up", "ArrowUp"],
  ["score-down", "ArrowDown"],
  ["obs-quick-reconnect", "Alt+1"],
  ["obs-disconnect", "Alt+2"],
  ["reset-score-global", "Control+R"],
]);

export const globalShortcuts = new Map<Action, () => void>([
  [
    "obs-quick-reconnect",
    () => {
      const ip = useSettingsStore.getState().websocketIp;
      const password = useSettingsStore.getState().websocketPassword;
      const port = useSettingsStore.getState().websocketPort;
      if (ip !== "" && password !== "" && port !== "") {
        send(
          "obs/connect",
          useSettingsStore.getState().websocketIp,
          useSettingsStore.getState().websocketPort,
          useSettingsStore.getState().websocketPassword,
        );
      }
    },
  ],
  ["obs-disconnect", () => send("obs/disconnect")],
]);

export const createShortcutsSlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  ShortcutsSlice
> = (set) => ({
  shortcuts: defaultShortcuts,
  updateKeys: (newShortcuts) => {
    set((state) => {
      state.shortcuts = newShortcuts;
    });

    const newShortcutSettings = [] as ShortcutSettings;
    newShortcuts.forEach((hotkey, action) =>
      newShortcutSettings.push({ action: action, hotkey: hotkey }),
    );

    send("shortcuts/save-shortcuts", newShortcutSettings).catch((error) =>
      console.log(error),
    );
  },
  resetShortcutsToDefault: () =>
    set((state) => (state.shortcuts = defaultShortcuts)),
});

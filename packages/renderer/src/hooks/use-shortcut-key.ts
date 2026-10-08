import { Action } from "@app/common";
import { Hotkey } from "@tanstack/react-hotkeys";
import { useSettingsStore } from "@renderer/zustand/store";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";

export function useShortcutKey(action: Action): Hotkey {
  return (
    useSettingsStore((store) => store.shortcuts.get(action)) ??
    (defaultShortcuts.get(action) as Hotkey)
  );
}

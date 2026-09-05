import { globalShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
import { useSettingsStore } from "@renderer/zustand/store";
import { useHotkeys } from "@tanstack/react-hotkeys";

function GlobalHotkeys({ children }: { children: React.ReactNode }) {
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const actions = Array.from(globalShortcuts.entries()).flatMap(
    ([action, callback]) => {
      const currentHotkey = shortcuts.get(action);
      if (!currentHotkey) return [];
      return [{ hotkey: currentHotkey, callback }];
    },
  );

  useHotkeys(
    actions.map((action) => ({
      hotkey: action.hotkey,
      callback: action.callback,
    })),
  );

  return <>{children}</>;
}

export default GlobalHotkeys;

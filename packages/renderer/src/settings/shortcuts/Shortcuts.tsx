import { Button } from "@renderer/components/ui/button";
import { ActionToName } from "@renderer/utils/helpers";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
import { Action } from "@app/common";
import { useSettingsStore } from "@renderer/zustand/store";
import {
  formatForDisplay,
  Hotkey,
  useHotkeyRecorder,
} from "@tanstack/react-hotkeys";
import { useState } from "react";
import { useHydratedState } from "@renderer/hooks/use-hydrated-state";

function Shortcuts() {
  const savedShortcuts = useSettingsStore((state) => state.shortcuts);
  const update = useSettingsStore((state) => state.updateKeys);
  const [shortcuts, setShortcuts] = useHydratedState(new Map(savedShortcuts));
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const areShortcutsSaved = Array.from(shortcuts).every(
    ([action, hotkey]) => savedShortcuts.get(action) === hotkey,
  );
  const hasDuplicateKeys = () => {
    const keySet = new Set<Hotkey>();
    for (const [_, hotkey] of shortcuts) {
      if (keySet.has(hotkey))
        return {
          exists: true,
          duplicateKey: hotkey,
        };
      keySet.add(hotkey);
    }
    return {
      exists: false,
      duplicateKey: null,
    };
  };
  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      if (editingAction) {
        setShortcuts((shortcuts) =>
          new Map(shortcuts).set(editingAction, hotkey),
        );
      }
    },

    onCancel: () => {
      setEditingAction(null);
    },
  });

  const existsDuplicateKeys = hasDuplicateKeys();
  return (
    <form
      className="flex flex-col gap-4 w-full p-2"
      onSubmit={(e) => {
        e.preventDefault();
        update(shortcuts);
      }}
    >
      <h1 className="text-center">Keyboard shortcuts settings</h1>
      {existsDuplicateKeys.exists && (
        <h2 className="text-center">
          Multiple actions are set to the same keybind:{" "}
          {existsDuplicateKeys.duplicateKey}
        </h2>
      )}
      {!areShortcutsSaved && (
        <h2 className="text-center">Shortcut changes are not saved.</h2>
      )}
      <div>
        {Array.from(shortcuts).map(([action, hotkey]) => (
          <div key={action} className="flex justify-between">
            <span>
              {ActionToName[action]}{" "}
              {savedShortcuts.get(action) !== shortcuts.get(action) && "*"}
            </span>
            <div className="flex gap-2">
              <span>{formatForDisplay(hotkey)}</span>
              <Button
                type="button"
                onClick={() => {
                  setEditingAction(action);
                  recorder.startRecording();
                }}
                disabled={editingAction === action && recorder.isRecording}
              >
                {editingAction === action && recorder.isRecording
                  ? "Editing..."
                  : "Press Keys"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button disabled={existsDuplicateKeys.exists} type="submit">
        Save keybind settings
      </Button>
      <Button
        type="button"
        onClick={() => {
          setShortcuts(new Map(savedShortcuts));
        }}
      >
        Reset all unsaved keybinds
      </Button>
      <Button
        type="button"
        onClick={() => {
          setShortcuts(new Map(defaultShortcuts));
        }}
      >
        Reset all keybinds to default
      </Button>
    </form>
  );
}

export default Shortcuts;

import { Button } from "@renderer/components/ui/button";
import { ActionToName } from "@renderer/utils/helpers";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
import { Action, isGlobalAction, isSafeGlobalHotkey } from "@app/common";
import { send } from "@app/preload";
import { useSettingsStore } from "@renderer/zustand/store";
import {
  formatForDisplay,
  Hotkey,
  useHotkeyRecorder,
} from "@tanstack/react-hotkeys";
import { useEffect, useState } from "react";

function findDuplicate(map: Map<Action, Hotkey>) {
  const seen = new Set<Hotkey>();
  for (const hotkey of map.values()) {
    if (seen.has(hotkey)) return hotkey;
    seen.add(hotkey);
  }
  return null;
}

function Shortcuts() {
  const saved = useSettingsStore((s) => s.shortcuts);
  const updateKeys = useSettingsStore((s) => s.updateKeys);
  const [edits, setEdits] = useState(new Map<Action, Hotkey>());
  const [editing, setEditing] = useState<Action | null>(null);

  const draft = new Map([...saved, ...edits]); // saved + edits, computed each render
  const isDirty = (a: Action) => edits.has(a) && edits.get(a) !== saved.get(a);
  const anyDirty = [...draft.keys()].some(isDirty);
  const duplicate = findDuplicate(draft);
  const unsafe = [...draft]
    .filter(([a, k]) => isGlobalAction(a) && !isSafeGlobalHotkey(k))
    .map(([a]) => ActionToName[a]);

  // release global keys so hotkeys can be recorded
  useEffect(() => {
    send("shortcuts/suspend-global").catch(console.error);
    return () => {
      send("shortcuts/resume-global").catch(console.error);
    };
  }, []);

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      if (editing) setEdits((e) => new Map(e).set(editing, hotkey));
      setEditing(null);
    },
    onCancel: () => setEditing(null),
  });

  const onSave = () =>
    updateKeys(draft)
      .then(() => setEdits(new Map()))
      .catch(console.error);

  return (
    <form
      className="flex flex-col gap-4 w-full p-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h1 className="text-center">Keyboard shortcuts settings</h1>
      {duplicate && (
        <h2 className="text-center">
          Multiple actions are set to the same keybind:{" "}
          {formatForDisplay(duplicate)}
        </h2>
      )}
      {unsafe.length > 0 && (
        <h2 className="text-center">
          These work even when the app isn't focused, so they need Ctrl, Alt or
          Cmd (or an F-key): {unsafe.join(", ")}
        </h2>
      )}
      {anyDirty && (
        <h2 className="text-center">Shortcut changes are not saved.</h2>
      )}

      <div>
        {[...draft].map(([action, hotkey]) => (
          <div key={action} className="flex justify-between">
            <span>
              {ActionToName[action]} {isDirty(action) && "*"}
            </span>
            <div className="flex gap-2">
              <span>{formatForDisplay(hotkey)}</span>
              <Button
                type="button"
                onClick={() => {
                  setEditing(action);
                  recorder.startRecording();
                }}
                disabled={editing === action && recorder.isRecording}
              >
                {editing === action && recorder.isRecording
                  ? "Editing..."
                  : "Press Keys"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={!!duplicate || unsafe.length > 0 || !anyDirty}
      >
        Save keybind settings
      </Button>
      <Button type="button" onClick={() => setEdits(new Map())}>
        Reset all unsaved keybinds
      </Button>
      <Button type="button" onClick={() => setEdits(new Map(defaultShortcuts))}>
        Reset all keybinds to default
      </Button>
    </form>
  );
}

export default Shortcuts;

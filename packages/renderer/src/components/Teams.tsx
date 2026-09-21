import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { Button } from "./ui/button";
import Team from "./Team";
import { useSettingsStore } from "@renderer/zustand/store";
import { Badge } from "lucide-react";
import { Toggle } from "./ui/toggle";
import { swapCharacters } from "@renderer/utils/helpers";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
import { Hotkey, useHotkey } from "@tanstack/react-hotkeys";
import { useRef } from "react";

const Teams = withForm({
  defaultValues: MatchDefaultValues,
  render: function TeamsScreen({ form }) {
    const reversedOrder = useSettingsStore(
      (state) => state.slippiReversedOrder,
    );
    const updateReversedOrder = useSettingsStore(
      (state) => state.updateSlippiReversedOrder,
    );

    const teamsScreenRef = useRef<HTMLDivElement>(null);
    const resetScoreGlobalHotkey =
      useSettingsStore((state) => state.shortcuts.get("reset-score-global")) ??
      (defaultShortcuts.get("reset-score-global") as Hotkey);

    useHotkey(
      resetScoreGlobalHotkey,
      () => {
        for (let i = 0; i < form.getFieldValue("teams").length; i++) {
          form.resetField(`teams[${i}].score`);
        }
      },
      {
        target: teamsScreenRef,
      },
    );

    return (
      <div ref={teamsScreenRef}>
        <div className="flex gap-4 justify-center">
          <Button
            type="button"
            onClick={() => {
              form.swapFieldValues("teams", 0, 1);
            }}
          >
            Swap Teams
          </Button>
          <Button
            type="button"
            onClick={() => {
              for (let i = 0; i < form.getFieldValue("teams").length; i++) {
                form.resetField(`teams[${i}].score`);
              }
            }}
          >
            Reset all Scores
          </Button>
          <Toggle
            variant="outline"
            name="reverse-order"
            id="reverse-order"
            pressed={reversedOrder}
            onPressedChange={(p) => {
              updateReversedOrder(p);
              swapCharacters(form, 0, 1);
            }}
          >
            <Badge className="group-data-[state=on]/toggle:fill-foreground" />{" "}
            Reverse character order
          </Toggle>
        </div>
        <div className="flex gap-1">
          {form.getFieldValue(`teams`).map((_, i) => (
            <Team key={i} form={form} teamNumber={i} />
          ))}
        </div>
      </div>
    );
  },
});

export default Teams;

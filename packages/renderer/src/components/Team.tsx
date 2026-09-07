import { usePlayerFormFieldArrayContext } from "@renderer/hooks/use-player-form-field-array-context";
import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Spinbox } from "./ui/spinbox";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { Badge } from "lucide-react";
import Player from "./Player";
import { Tournament } from "@app/common";
import { useRef } from "react";
import { Hotkey, useHotkey } from "@tanstack/react-hotkeys";
import { useSettingsStore } from "@renderer/zustand/store";
import { getValueWithinRange } from "@renderer/utils/helpers";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";

function Team({ teamNum }: { teamNum: number }) {
  const max = 100;
  const min = 0;
  const players = usePlayerFormFieldArrayContext();
  const { setValue, getValues } = useFormContext<Tournament>();

  const teamPanelRef = useRef<HTMLDivElement>(null);

  const scoreIncreaseHotkey =
    useSettingsStore((state) => state.shortcuts.get("score-up")) ??
    (defaultShortcuts.get("score-up") as Hotkey);

  const scoreDecreaseHotkey =
    useSettingsStore((state) => state.shortcuts.get("score-down")) ??
    (defaultShortcuts.get("score-down") as Hotkey);

  const getKeys = () => {
    if (teamNum === 0) {
      return {
        teamIncreaseKey:
          useSettingsStore((state) =>
            state.shortcuts.get("team-left-score-up"),
          ) ?? (defaultShortcuts.get("team-left-score-up") as Hotkey),
        teamDecreaseKey:
          useSettingsStore((state) =>
            state.shortcuts.get("team-left-score-down"),
          ) ?? (defaultShortcuts.get("team-left-score-down") as Hotkey),
      };
    }
    return {
      teamIncreaseKey:
        useSettingsStore((state) =>
          state.shortcuts.get("team-right-score-up"),
        ) ?? (defaultShortcuts.get("team-right-score-up") as Hotkey),
      teamDecreaseKey:
        useSettingsStore((state) =>
          state.shortcuts.get("team-right-score-down"),
        ) ?? (defaultShortcuts.get("team-right-score-down") as Hotkey),
    };
  };

  const { teamIncreaseKey, teamDecreaseKey } = getKeys();

  useHotkey(teamDecreaseKey, () =>
    setValue(
      `teams.${teamNum}.score`,
      getValueWithinRange(getValues(`teams.${teamNum}.score`) - 1, max, min),
    ),
  );

  useHotkey(teamIncreaseKey, () =>
    setValue(
      `teams.${teamNum}.score`,
      getValueWithinRange(getValues(`teams.${teamNum}.score`) + 1, max, min),
    ),
  );

  useHotkey(
    scoreDecreaseHotkey,
    () =>
      setValue(
        `teams.${teamNum}.score`,
        getValueWithinRange(getValues(`teams.${teamNum}.score`) - 1, max, min),
      ),
    { target: teamPanelRef },
  );

  useHotkey(
    scoreIncreaseHotkey,
    () =>
      setValue(
        `teams.${teamNum}.score`,
        getValueWithinRange(getValues(`teams.${teamNum}.score`) + 1, max, min),
      ),
    { target: teamPanelRef },
  );

  return (
    <div tabIndex={-1} ref={teamPanelRef} className="p-1 w-full">
      <Controller
        name={`teams.${teamNum}.name`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="w-full py-2">
            <Input
              className="text-center"
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${teamNum}-name`}
            />
          </Field>
        )}
      />

      <div className="flex items-end justify-evenly gap-2 pb-2">
        <Controller
          name={`teams.${teamNum}.score`}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="w-fit">
              <FieldLabel className="text-center flex justify-center">
                Score
              </FieldLabel>
              <Spinbox
                numberValue={field.value as number}
                onChangeNumber={field.onChange}
                min={0}
                max={100}
                {...field}
              />
            </Field>
          )}
        ></Controller>
        <Button
          type="button"
          className="px-8"
          onClick={() => setValue(`teams.${teamNum}.score`, 0)}
        >
          Reset Score
        </Button>
        <Controller
          name={`teams.${teamNum}.inLosers`}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="w-fit">
              <Toggle
                variant="outline"
                name={field.name}
                pressed={field.value as boolean}
                onPressedChange={field.onChange}
                aria-label={`Team ${teamNum + 1} toggle losers`}
              >
                <Badge className="group-data-[state=on]/toggle:fill-foreground" />{" "}
                In Losers
              </Toggle>
            </Field>
          )}
        ></Controller>
      </div>
      <div className="flex flex-col gap-4 w-full">
        {players[teamNum].fields.map((player, playerNum) => (
          <Player key={player.id} teamNum={teamNum} playerNum={playerNum} />
        ))}
      </div>
    </div>
  );
}
export default Team;

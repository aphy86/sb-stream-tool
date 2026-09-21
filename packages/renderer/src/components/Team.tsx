import { useGameProfile } from "@renderer/hooks/use-game-profile";
import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { useSelector } from "@tanstack/react-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Spinbox } from "./ui/spinbox";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { Badge } from "lucide-react";
import Player from "./Player";
import { useRef } from "react";
import { useSettingsStore } from "@renderer/zustand/store";
import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
import { Hotkey, useHotkey } from "@tanstack/react-hotkeys";
import { getValueWithinRange } from "@renderer/utils/helpers";
const Team = withForm({
  defaultValues: MatchDefaultValues,
  props: {
    teamNumber: 0,
  },
  render: function TeamSection({ form, teamNumber }) {
    const max = 100;
    const min = 0;
    const gameProfile = useGameProfile();
    const setFormat = useSelector(
      form.store,
      (state) => state.values.setFormat,
    );
    const teamPanelRef = useRef<HTMLDivElement>(null);

    const scoreIncreaseHotkey =
      useSettingsStore((state) => state.shortcuts.get("score-up")) ??
      (defaultShortcuts.get("score-up") as Hotkey);

    const scoreDecreaseHotkey =
      useSettingsStore((state) => state.shortcuts.get("score-down")) ??
      (defaultShortcuts.get("score-down") as Hotkey);

    const leftUp = useSettingsStore((state) =>
      state.shortcuts.get("team-left-score-up"),
    );
    const leftDown = useSettingsStore((state) =>
      state.shortcuts.get("team-left-score-down"),
    );
    const rightUp = useSettingsStore((state) =>
      state.shortcuts.get("team-right-score-up"),
    );
    const rightDown = useSettingsStore((state) =>
      state.shortcuts.get("team-right-score-down"),
    );

    const increaseScore = () => {
      form.setFieldValue(
        `teams[${teamNumber}].score`,
        getValueWithinRange(
          form.getFieldValue(`teams[${teamNumber}].score`) + 1,
          max,
          min,
        ),
      );
    };

    const decreaseScore = () => {
      form.setFieldValue(
        `teams[${teamNumber}].score`,
        getValueWithinRange(
          form.getFieldValue(`teams[${teamNumber}].score`) - 1,
          max,
          min,
        ),
      );
    };
    useHotkey(scoreDecreaseHotkey, decreaseScore, {
      target: teamPanelRef,
    });

    useHotkey(scoreIncreaseHotkey, increaseScore, { target: teamPanelRef });

    const getKeys = () => {
      if (teamNumber === 0) {
        return {
          teamIncreaseKey:
            leftUp ?? (defaultShortcuts.get("team-left-score-up") as Hotkey),
          teamDecreaseKey:
            leftDown ??
            (defaultShortcuts.get("team-left-score-down") as Hotkey),
        };
      }
      return {
        teamIncreaseKey:
          rightUp ?? (defaultShortcuts.get("team-right-score-up") as Hotkey),
        teamDecreaseKey:
          rightDown ??
          (defaultShortcuts.get("team-right-score-down") as Hotkey),
      };
    };

    const { teamIncreaseKey, teamDecreaseKey } = getKeys();

    useHotkey(teamIncreaseKey, () => increaseScore());
    useHotkey(teamDecreaseKey, () => decreaseScore());

    return (
      <div tabIndex={-1} ref={teamPanelRef} className="w-full">
        <div className="flex flex-col gap-0.5">
          <form.Field name={`teams[${teamNumber}].name`}>
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}></FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    aria-invalid={isInvalid}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                </Field>
              );
            }}
          </form.Field>
          {setFormat === "Doubles" && (
            <div>
              <form.Field name={`teams[${teamNumber}].color`}>
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Team Color</FieldLabel>
                      <Select
                        value={field.state.value ?? ""}
                        onValueChange={(value) => field.handleChange(value)}
                      >
                        <SelectTrigger id={field.name} name={field.name}>
                          <SelectValue placeholder="Select Team Color">
                            {field.state.value}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {gameProfile.teamColors.map((color) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  );
                }}
              </form.Field>
            </div>
          )}
        </div>
        <div className="flex items-end justify-evenly gap-2 p-2">
          <form.Field name={`teams[${teamNumber}].score`}>
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Score</FieldLabel>
                  <Spinbox
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    min={0}
                    max={100}
                  ></Spinbox>
                </Field>
              );
            }}
          </form.Field>
          <Button
            type="button"
            onClick={() => form.resetField(`teams[${teamNumber}].score`)}
          >
            Reset Score
          </Button>
          <form.Field name={`teams[${teamNumber}].inLosers`}>
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <Toggle
                    variant="outline"
                    name={field.name}
                    id={field.name}
                    pressed={field.state.value}
                    onPressedChange={(p) => field.handleChange(p)}
                  >
                    <Badge className="group-data-[state=on]/toggle:fill-foreground" />{" "}
                    In Losers
                  </Toggle>
                </Field>
              );
            }}
          </form.Field>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {form.getFieldValue(`teams[${teamNumber}].players`).map((_, i) => (
            <Player
              key={i}
              form={form}
              teamNumber={teamNumber}
              playerNumber={i}
            ></Player>
          ))}
        </div>
      </div>
    );
  },
});

export default Team;
// import { usePlayerFormFieldArrayContext } from "@renderer/hooks/use-player-form-field-array-context";
// import { Controller, useFormContext, useWatch } from "react-hook-form";
// import { Field, FieldLabel } from "./ui/field";
// import { Input } from "./ui/input";
// import { Spinbox } from "./ui/spinbox";
// import { Button } from "./ui/button";
// import { Toggle } from "./ui/toggle";
// import { Badge } from "lucide-react";
// import Player from "./Player";
// import { Tournament } from "@app/common";
// import { useRef } from "react";
// import { Hotkey, useHotkey } from "@tanstack/react-hotkeys";
// import { useSettingsStore } from "@renderer/zustand/store";
// import { getValueWithinRange } from "@renderer/utils/helpers";
// import { defaultShortcuts } from "@renderer/zustand/slices/shortcutsSlice";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "./ui/select";
// import { useGameProfile } from "@renderer/hooks/use-game-profile";

// function Team({ teamNum }: { teamNum: number }) {
//   const max = 100;
//   const min = 0;
//   const players = usePlayerFormFieldArrayContext();
//   const { setValue, getValues } = useFormContext<Tournament>();
//   const watchSetFormat = useWatch({ name: "setFormat" });

//   const gameProfile = useGameProfile();
//   const teamPanelRef = useRef<HTMLDivElement>(null);

//   const scoreIncreaseHotkey =
//     useSettingsStore((state) => state.shortcuts.get("score-up")) ??
//     (defaultShortcuts.get("score-up") as Hotkey);

//   const scoreDecreaseHotkey =
//     useSettingsStore((state) => state.shortcuts.get("score-down")) ??
//     (defaultShortcuts.get("score-down") as Hotkey);

//   const getKeys = () => {
//     if (teamNum === 0) {
//       return {
//         teamIncreaseKey:
//           useSettingsStore((state) =>
//             state.shortcuts.get("team-left-score-up"),
//           ) ?? (defaultShortcuts.get("team-left-score-up") as Hotkey),
//         teamDecreaseKey:
//           useSettingsStore((state) =>
//             state.shortcuts.get("team-left-score-down"),
//           ) ?? (defaultShortcuts.get("team-left-score-down") as Hotkey),
//       };
//     }
//     return {
//       teamIncreaseKey:
//         useSettingsStore((state) =>
//           state.shortcuts.get("team-right-score-up"),
//         ) ?? (defaultShortcuts.get("team-right-score-up") as Hotkey),
//       teamDecreaseKey:
//         useSettingsStore((state) =>
//           state.shortcuts.get("team-right-score-down"),
//         ) ?? (defaultShortcuts.get("team-right-score-down") as Hotkey),
//     };
//   };

//   const { teamIncreaseKey, teamDecreaseKey } = getKeys();

//   useHotkey(teamDecreaseKey, () =>
//     setValue(
//       `teams.${teamNum}.score`,
//       getValueWithinRange(getValues(`teams.${teamNum}.score`) - 1, max, min),
//     ),
//   );

//   useHotkey(teamIncreaseKey, () =>
//     setValue(
//       `teams.${teamNum}.score`,
//       getValueWithinRange(getValues(`teams.${teamNum}.score`) + 1, max, min),
//     ),
//   );

//   useHotkey(
//     scoreDecreaseHotkey,
//     () =>
//       setValue(
//         `teams.${teamNum}.score`,
//         getValueWithinRange(getValues(`teams.${teamNum}.score`) - 1, max, min),
//       ),
//     { target: teamPanelRef },
//   );

//   useHotkey(
//     scoreIncreaseHotkey,
//     () =>
//       setValue(
//         `teams.${teamNum}.score`,
//         getValueWithinRange(getValues(`teams.${teamNum}.score`) + 1, max, min),
//       ),
//     { target: teamPanelRef },
//   );

//   return (
//     <div tabIndex={-1} ref={teamPanelRef} className="p-1 w-full">
//       <div className="flex flex-col gap-0.5">
//         <Controller
//           name={`teams.${teamNum}.name`}
//           render={({ field, fieldState }) => (
//             <Field data-invalid={fieldState.invalid} className="w-full py-2">
//               <Input
//                 className="text-center"
//                 {...field}
//                 aria-invalid={fieldState.invalid}
//                 id={`${teamNum}-name`}
//               />
//             </Field>
//           )}
//         />
//         {watchSetFormat.includes("Doubles") && (
//           <div>
//             <Controller
//               name={`teams.${teamNum}.color`}
//               render={({ field, fieldState }) => (
//                 <Field data-invalid={fieldState.invalid}>
//                   <FieldLabel htmlFor={`teams-${teamNum}-color`}>
//                     Team Color
//                   </FieldLabel>
//                   <Select
//                     value={field.value || ""}
//                     onValueChange={field.onChange}
//                     name={field.name}
//                   >
//                     <SelectTrigger id={`teams-${teamNum}-color`}>
//                       <SelectValue placeholder="Select Team Color">
//                         {field.value}
//                       </SelectValue>
//                     </SelectTrigger>
//                     <SelectContent>
//                       {gameProfile.teamColors.map((color) => (
//                         <SelectItem key={`teamColor-${color}`} value={color}>
//                           {color}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </Field>
//               )}
//             />
//           </div>
//         )}
//       </div>
//       <div className="flex items-end justify-evenly gap-2 p-2">
//         <Controller
//           name={`teams.${teamNum}.score`}
//           render={({ field, fieldState }) => (
//             <Field data-invalid={fieldState.invalid} className="w-fit">
//               <FieldLabel
//                 htmlFor="score"
//                 className="text-center flex justify-center"
//               >
//                 Score
//               </FieldLabel>
//               <Spinbox
//                 id="score"
//                 numberValue={field.value as number}
//                 onChangeNumber={field.onChange}
//                 min={0}
//                 max={100}
//                 {...field}
//               />
//             </Field>
//           )}
//         ></Controller>
//         <Button
//           type="button"
//           className="px-8"
//           onClick={() => setValue(`teams.${teamNum}.score`, 0)}
//         >
//           Reset Score
//         </Button>
//         <Controller
//           name={`teams.${teamNum}.inLosers`}
//           render={({ field, fieldState }) => (
//             <Field data-invalid={fieldState.invalid} className="w-fit">
//               <Toggle
//                 variant="outline"
//                 name={field.name}
//                 pressed={field.value as boolean}
//                 onPressedChange={field.onChange}
//                 aria-label={`Team ${teamNum + 1} toggle losers`}
//               >
//                 <Badge className="group-data-[state=on]/toggle:fill-foreground" />{" "}
//                 In Losers
//               </Toggle>
//             </Field>
//           )}
//         ></Controller>
//       </div>
//       <div className="flex flex-col gap-4 w-full">
//         {players[teamNum].fields.map((player, playerNum) => (
//           <Player key={player.id} teamNum={teamNum} playerNum={playerNum} />
//         ))}
//       </div>
//     </div>
//   );
// }
// export default Team;

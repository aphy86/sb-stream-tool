// import { autoStopSlippiRelay } from "@app/preload";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandItem,
} from "./ui/command";
import {
  meleeAltCostumes,
  MeleeCharacter,
  meleeCharacters,
  Tournament,
} from "@app/common";
import { ChevronsUpDown } from "lucide-react";
import { useGameProfile } from "@renderer/hooks/use-game-profile";
import { tailwindBorderColorLookup } from "@renderer/utils/helpers";

function Player({
  teamNum,
  playerNum,
}: {
  teamNum: number;
  playerNum: number;
}) {
  const { setValue } = useFormContext<Tournament>();

  const gameProfile = useGameProfile();

  const characterSelected = useWatch({
    name: `teams.${teamNum}.players.${playerNum}.gameInfo.character`,
  }) as MeleeCharacter;
  const altCostumeSelected = useWatch({
    name: `teams.${teamNum}.players.${playerNum}.gameInfo.altCostume`,
  }) as string;
  const teamColor = useWatch({
    name: `teams.${teamNum}.color`,
  });
  const watchSetFormat = useWatch({
    name: "setFormat",
  });
  const [characterPopoverOpen, setCharacterPopoverOpen] = useState(false);

  const getBorderColor = () => {
    if (watchSetFormat.includes("Doubles")) {
      if (teamColor) {
        return (
          tailwindBorderColorLookup[
            teamColor.toLowerCase() as keyof typeof tailwindBorderColorLookup
          ] ?? "border-white"
        );
      }
    }
    return "border-white";
  };

  return (
    <div className={`rounded-md border-2 ${getBorderColor()} py-2 px-2 w-full`}>
      <div className="w-full">
        <h6 className="text-center">Player {playerNum + 1}</h6>
        <div className="px-16 my-2">
          <Button
            type="button"
            onClick={() =>
              setValue(`teams.${teamNum}.players.${playerNum}`, {
                playerInfo: {
                  teamName: "",
                  playerTag: "",
                  pronouns: "",
                  twitter: "",
                },
                gameInfo: {
                  character: "Random",
                  altCostume: "Default",
                  port: playerNum + 1,
                },
              })
            }
            className="w-full"
          >
            Clear Info
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <FieldGroup className="w-full grid grid-cols-8 gap-x-2 gap-y-2">
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.playerInfo.teamName`}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="grid col-start-1 col-end-4"
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-teamName`}>
                  Team Name
                </FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id={`${teamNum}-${playerNum}-teamName`}
                />
              </Field>
            )}
          ></Controller>
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.playerInfo.playerTag`}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="grid col-start-4 col-end-9"
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-playerTag`}>
                  Player Tag
                </FieldLabel>
                <Input {...field} id={`${teamNum}-${playerNum}-playerTag`} />
              </Field>
            )}
          ></Controller>
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.playerInfo.pronouns`}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="grid col-start-1 col-end-5"
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-pronouns`}>
                  Pronouns
                </FieldLabel>
                <Input {...field} id={`${teamNum}-${playerNum}-pronouns`} />
              </Field>
            )}
          ></Controller>
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.gameInfo.port`}
            render={({ field, fieldState }) => (
              <Field
                orientation="responsive"
                data-invalid={fieldState.invalid}
                className="grid col-start-5 col-end-9"
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-port`}>
                  Port
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id={`${teamNum}-${playerNum}-port`}
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue aria-label={field.value as string}>
                      {field.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {gameProfile.portNumbers.map((portNum) => (
                      <SelectItem
                        key={portNum.toString()}
                        value={portNum.toString()}
                      >
                        {portNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          ></Controller>
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.playerInfo.twitter`}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="grid col-start-1 col-end-9"
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-twitter`}>
                  Twitter
                </FieldLabel>
                <Input {...field} id={`${teamNum}-${playerNum}-twitter`} />
              </Field>
            )}
          ></Controller>
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.gameInfo.character`}
            render={({ field, fieldState }) => (
              <Field
                className="grid col-start-1 col-end-9"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-character`}>
                  Character
                </FieldLabel>
                <Popover
                  open={characterPopoverOpen}
                  onOpenChange={setCharacterPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      defaultValue="Random"
                      id={`${teamNum}-${playerNum}-character`}
                    >
                      {field.value}
                      <ChevronsUpDown></ChevronsUpDown>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Command>
                      <CommandInput placeholder="Search for characters"></CommandInput>
                      <CommandList>
                        <CommandEmpty>No character found</CommandEmpty>
                        {meleeCharacters.map((character) => (
                          <CommandItem
                            value={character}
                            key={character}
                            onSelect={() => {
                              setValue(
                                `teams.${teamNum}.players.${playerNum}.gameInfo.character`,
                                character,
                              );
                              setValue(
                                `teams.${teamNum}.players.${playerNum}.gameInfo.altCostume`,
                                "Default",
                              );
                              setCharacterPopoverOpen(false);
                            }}
                          >
                            {character}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
            )}
          ></Controller>
          <Controller
            name={`teams.${teamNum}.players.${playerNum}.gameInfo.altCostume`}
            render={({ field, fieldState }) => (
              <Field
                className="grid col-start-1 col-end-9"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel htmlFor={`${teamNum}-${playerNum}-altCostume`}>
                  Costume
                </FieldLabel>
                <Select
                  onValueChange={(e) => {
                    // https://github.com/radix-ui/primitives/issues/3068
                    if (e === "") {
                      // console.log(altCostumeSelected)
                      return;
                    }
                    field.onChange(e);
                  }}
                  value={field.value as string}
                  name={field.name}
                >
                  <SelectTrigger
                    id={`${teamNum}-${playerNum}-altCostume`}
                    className="w-full"
                  >
                    <SelectValue placeholder="Click for options" />
                  </SelectTrigger>
                  <SelectContent>
                    {meleeAltCostumes[characterSelected].colors.map(
                      (color, index) => (
                        <SelectItem
                          key={`characterSelected-color-${index}`}
                          value={color}
                        >
                          <img
                            src={`characters/melee/${characterSelected.toLowerCase()}/icons/${color.replace(/\s/g, "").toLowerCase()}.png`}
                            width={28}
                            height={28}
                          />
                          {color}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          ></Controller>
        </FieldGroup>
        <div className="w-3/5 flex items-center">
          <img
            src={`characters/melee/${characterSelected.toLowerCase()}/renders/${altCostumeSelected.replace(/\s/g, "").toLowerCase()}.png`}
          />
        </div>
      </div>
    </div>
  );
}

export default Player;

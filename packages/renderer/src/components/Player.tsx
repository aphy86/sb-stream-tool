import { useGameProfile } from "@renderer/hooks/use-game-profile";
import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { useSelector } from "@tanstack/react-form";
import { useState } from "react";
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
import { ChevronsUpDown, Minus, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { meleeAltCostumes, MeleeCharacter, meleeCharacters } from "@app/common";
import { tailwindTeamBorderColorLookup } from "@renderer/utils/helpers";

const Player = withForm({
  defaultValues: MatchDefaultValues,
  props: {
    teamNumber: 0,
    playerNumber: 0,
  },
  render: function PlayerSection({ form, teamNumber, playerNumber }) {
    const gameProfile = useGameProfile();
    const characterSelected = useSelector(
      form.store,
      (state) =>
        state.values.teams[teamNumber].players[playerNumber].gameInfo.character,
    );
    const altCostumeSelected = useSelector(
      form.store,
      (state) =>
        state.values.teams[teamNumber].players[playerNumber].gameInfo
          .altCostume,
    );

    const teamColor = useSelector(
      form.store,
      (state) => state.values.teams[teamNumber].color,
    );

    const getBorderColor = () => {
      if (form.getFieldValue("setFormat").includes("Doubles") && teamColor) {
        return (
          tailwindTeamBorderColorLookup[
            teamColor.toLowerCase() as keyof typeof tailwindTeamBorderColorLookup
          ] ?? "border-white"
        );
      }
      return "border-white";
    };

    const [characterPopoverOpen, setCharacterPopoverOpen] = useState(false);

    return (
      <div
        className={`rounded-md border-2 ${getBorderColor()} py-2 px-2 w-full`}
      >
        <div className="w-full">
          <h6 className="text-center">Player {playerNumber + 1}</h6>
          <div className="px-16 my-2">
            <Button
              type="button"
              onClick={() =>
                form.resetField(`teams[${teamNumber}].players[${playerNumber}]`)
              }
            >
              Clear Info
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <FieldGroup className="w-full grid grid-cols-8 gap-x-2 gap-y-2">
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].playerInfo.teamName`}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="grid col-start-1 col-end-4"
                  >
                    <FieldLabel htmlFor={field.name}>Team Name</FieldLabel>
                    <Input
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                      aria-invalid={isInvalid}
                    ></Input>
                  </Field>
                );
              }}
            </form.Field>
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].playerInfo.playerTag`}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="grid col-start-4 col-end-9"
                  >
                    <FieldLabel htmlFor={field.name}>Player Tag</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                    ></Input>
                  </Field>
                );
              }}
            </form.Field>
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].playerInfo.pronouns`}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="grid col-start-1 col-end-5"
                  >
                    <FieldLabel htmlFor={field.name}>Pronouns</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.currentTarget.value)
                      }
                    />
                  </Field>
                );
              }}
            </form.Field>
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].gameInfo.port`}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    orientation="responsive"
                    data-invalid={isInvalid}
                    className="grid col-start-5 col-end-9"
                  >
                    <FieldLabel htmlFor={field.name}>Port</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value.toString()}
                      onValueChange={(value) =>
                        field.handleChange(parseInt(value))
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        name={field.name}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {gameProfile.portNumbers.map((port) => (
                          <SelectItem key={port} value={port.toString()}>
                            {port}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            </form.Field>
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].playerInfo.socials`}
              mode="array"
            >
              {(field) => {
                return (
                  <div className="grid col-start-1 col-end-9 grid-cols-8 gap-x-2 gap-y-2">
                    <div className="col-start-1 col-end-9 flex w-full justify-between">
                      <h6>Socials</h6>
                      <div>
                        <Button
                          type="button"
                          onClick={() =>
                            form.pushFieldValue(
                              `teams[${teamNumber}].players[${playerNumber}].playerInfo.socials`,
                              { platform: "", username: "" },
                            )
                          }
                        >
                          <Plus />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            const length = form.getFieldValue(
                              `teams[${teamNumber}].players[${playerNumber}].playerInfo.socials`,
                            ).length;
                            if (length > 1) {
                              form.removeFieldValue(
                                `teams[${teamNumber}].players[${playerNumber}].playerInfo.socials`,
                                length - 1,
                              );
                            }
                          }}
                        >
                          <Minus />
                        </Button>
                      </div>
                    </div>
                    {field.state.value.map((_, i) => {
                      return (
                        <div
                          key={i}
                          className="col-start-1 col-end-9 grid grid-cols-8 gap-x-2"
                        >
                          <form.Field
                            name={`teams[${teamNumber}].players[${playerNumber}].playerInfo.socials[${i}].platform`}
                          >
                            {(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field
                                  className="grid col-start-1 col-end-5"
                                  data-invalid={isInvalid}
                                >
                                  <FieldLabel htmlFor={subField.name}>
                                    Platform
                                  </FieldLabel>
                                  <Input
                                    name={subField.name}
                                    id={subField.name}
                                    value={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.currentTarget.value,
                                      )
                                    }
                                    aria-invalid={isInvalid}
                                  ></Input>
                                </Field>
                              );
                            }}
                          </form.Field>
                          <form.Field
                            name={`teams[${teamNumber}].players[${playerNumber}].playerInfo.socials[${i}].username`}
                          >
                            {(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field
                                  className="grid col-start-5 col-end-9"
                                  data-invalid={isInvalid}
                                >
                                  <FieldLabel htmlFor={subField.name}>
                                    Username
                                  </FieldLabel>
                                  <Input
                                    name={subField.name}
                                    id={subField.name}
                                    value={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.currentTarget.value,
                                      )
                                    }
                                    aria-invalid={isInvalid}
                                  ></Input>
                                </Field>
                              );
                            }}
                          </form.Field>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            </form.Field>
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].gameInfo.character`}
              listeners={{
                onChange: () => {
                  form.resetField(
                    `teams[${teamNumber}].players[${playerNumber}].gameInfo.altCostume`,
                  );
                },
              }}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="grid col-start-1 col-end-9"
                  >
                    <FieldLabel htmlFor={field.name}>Character</FieldLabel>
                    <Popover
                      open={characterPopoverOpen}
                      onOpenChange={setCharacterPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          id={field.name}
                          name={field.name}
                          className="w-full"
                        >
                          {field.state.value}
                          <ChevronsUpDown></ChevronsUpDown>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Command>
                          <CommandInput placeholder="Search for characters"></CommandInput>
                          <CommandList>
                            <CommandEmpty>No characters found</CommandEmpty>
                            {meleeCharacters.map((character) => (
                              <CommandItem
                                value={character}
                                key={character}
                                onSelect={(character) => {
                                  field.handleChange(character);
                                  // setCharacterPopoverOpen(false);
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
                );
              }}
            </form.Field>
            <form.Field
              name={`teams[${teamNumber}].players[${playerNumber}].gameInfo.altCostume`}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    className="grid col-start-1 col-end-9"
                    data-invalid={isInvalid}
                  >
                    <FieldLabel htmlFor={field.name}>Costume</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger id={field.name} name={field.name}>
                        <SelectValue placeholder="Click for options"></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {meleeAltCostumes[
                          characterSelected as MeleeCharacter
                        ].colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <img
                              src={`characters/melee/${characterSelected.toLowerCase()}/icons/${color.replace(/\s/g, "").toLowerCase()}.png`}
                              width={28}
                              height={28}
                            />
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
          <div className="w-3/5 flex items-center">
            <img
              src={`characters/melee/${characterSelected.toLowerCase()}/renders/${altCostumeSelected.replace(/\s/g, "").toLowerCase()}.png`}
            />
          </div>
        </div>
      </div>
    );
  },
});

export default Player;

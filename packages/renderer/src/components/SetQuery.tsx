// import { usePlayerFormFieldArrayContext } from "@renderer/hooks/use-player-form-field-array-context";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useRef, useState } from "react";
import { useSettingsStore } from "@renderer/zustand/store";
import { useFormContext } from "react-hook-form";
import { Tournament } from "@app/common";
import {
  changeSetFormat,
  getSetFormat,
  isInPlacementList,
} from "@renderer/utils/helpers";
import { usePlayerFormFieldArrayContext } from "@renderer/hooks/use-player-form-field-array-context";
import { getPlatformByEventUrl } from "@renderer/platform/registry";

function SetQuery() {
  const [setId, setSetId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const eventUrl = useSettingsStore((state) => state.eventUrl);
  const platform = getPlatformByEventUrl(eventUrl);
  const apiKey = useSettingsStore(
    (state) => state.credentials[platform.id] ?? "",
  );
  const { setValue, getValues } = useFormContext<Tournament>();
  const teams = usePlayerFormFieldArrayContext();
  const timeoutId = useRef<NodeJS.Timeout>(undefined);
  const handleClick = async () => {
    setStatusMessage("");
    if (setId === "") {
      setStatusMessage("Please type in a set ID");
      return;
    }

    setLoading(true);
    setError(undefined);

    let set;
    try {
      set = await platform.withApiKey(apiKey).getSet(setId);
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error(String(reason)));
    } finally {
      setLoading(false);
    }

    if (!set) {
      setStatusMessage("No information found");
      return;
    }

    setStatusMessage(`Set ${setId} found! Applying information...`);
    setValue("name", set.tournamentName);

    const setFormat = getSetFormat(
      getValues("teams.0.players").length,
      set.entrants[0]?.players.length ?? 0,
    );
    changeSetFormat(setFormat, teams);
    setValue("setFormat", setFormat);

    const setRoundFormat = set.matchName;
    const parsedSetRoundFormat = setRoundFormat?.split(" ");
    if (
      (setRoundFormat.includes("Losers Round") ||
        setRoundFormat.includes("Winners Round")) &&
      parsedSetRoundFormat.length === 3 // "losers round 1", "winners round 2", has to have at least 3 characters, etc
    ) {
      setValue(
        "roundFormat",
        `${parsedSetRoundFormat[0]} ${parsedSetRoundFormat[1]}`,
      );
      setValue("roundNumber", parseInt(parsedSetRoundFormat[2]) ?? 0);
    } else {
      if (isInPlacementList(setRoundFormat)) {
        setValue("roundFormat", setRoundFormat);
        setValue("customRoundFormat", "");
      } else {
        setValue("roundFormat", "Custom Match");
        setValue("customRoundFormat", setRoundFormat);
      }
      setValue("roundNumber", 0);
    }
    for (let i = 0; i < getValues("teams").length; i++) {
      for (let j = 0; j < getValues(`teams.${i}.players`).length; j++) {
        setValue(`teams.${i}.players.${j}.playerInfo`, {
          teamName: set.entrants[i]?.players[j]?.teamName ?? "",
          playerTag: set.entrants[i]?.players[j]?.playerTag ?? "",
          pronouns: set.entrants[i]?.players[j]?.pronouns ?? "",
          twitter: set.entrants[i]?.players[j]?.twitter ?? "",
        });
      }
    }

    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      setStatusMessage("");
      setSheetOpen(false);
    }, 2000);
  };

  return (
    <Sheet
      open={sheetOpen}
      onOpenChange={(open) => {
        setStatusMessage("");
        setSheetOpen(open);
      }}
    >
      <SheetTrigger asChild>
        <Button
          disabled={!platform.supportsSetLookup || !apiKey || apiKey === ""}
          title={
            platform.supportsSetLookup
              ? undefined
              : `${platform.displayName} does not support looking a set up by id`
          }
        >
          Get a specific set
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Set Query</SheetTitle>
          <SheetDescription>
            Get a specific set's information (players, etc)
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <Label className="pb-1">Set ID</Label>
          <Input
            value={setId}
            onChange={(e) => setSetId(e.currentTarget.value)}
          />
        </div>
        {statusMessage}
        {loading && <h2>Getting Set {setId}'s information, please wait...</h2>}
        {error && <h2>An error has occurred:{error.message}</h2>}
        <SheetFooter>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <Button type="button" onClick={handleClick}>
            Get Information
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
export default SetQuery;

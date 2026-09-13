import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { useSettingsStore } from "@renderer/zustand/store";
import { useRef, useState } from "react";
import * as z from "zod";
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
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { setFieldValues } from "@renderer/utils/helpers";
import { getPlatformByEventUrl } from "@renderer/platform/registry";

const ValidSet = z.string().min(1, "Set ID cannot be empty");

const FetchSet = withForm({
  defaultValues: MatchDefaultValues,
  render: function FetchSetSection({ form }) {
    const [setId, setSetId] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const timeoutId = useRef<NodeJS.Timeout>(undefined);
    const eventUrl = useSettingsStore((state) => state.eventUrl);
    const platform = getPlatformByEventUrl(eventUrl);
    const apiKey =
      useSettingsStore((state) => state.credentials[platform.id]) ?? "";

    const clear = () => {
      setStatus("");
      setError("");
    };

    const handleClick = async () => {
      const validSet = ValidSet.safeParse(setId);

      clear();

      if (!validSet.success) {
        setError(validSet.error.issues[0]?.message ?? "");
        return;
      }
      setLoading(true);
      let set;
      try {
        set = await platform.withApiKey(apiKey).getSet(validSet.data);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : new Error(String(reason)).message,
        );
      }
      setLoading(false);
      if (!set) {
        setError("No information found");
        return;
      }
      setStatus(`Set ${validSet.data} found! Applying set data...`);

      setFieldValues(form, set);

      clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        clear();
        setSheetOpen(false);
      }, 1500);
    };

    return (
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          clear();
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
            <SheetTitle>Get a set</SheetTitle>
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
          {status}
          {error}
          {loading && (
            <h2>Getting Set {setId}'s information, please wait...</h2>
          )}
          <SheetFooter>
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
  },
});

export default FetchSet;

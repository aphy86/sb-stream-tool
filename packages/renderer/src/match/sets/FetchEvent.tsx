import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useSettingsStore } from "@renderer/zustand/store";
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
import { useHydratedState } from "@renderer/hooks/use-hydrated-state";
import {
  getClient,
  getPlatformByEventUrl,
  resolveEventUrl,
} from "@renderer/platform/registry";

function FetchEvent() {
  const savedEventUrl = useSettingsStore((state) => state.eventUrl);
  const update = useSettingsStore((state) => state.updateEventUrl);
  const [eventUrl, setEventUrl] = useHydratedState(savedEventUrl);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const savedApiKey = useSettingsStore(
    (state) => state.credentials[getPlatformByEventUrl(savedEventUrl).id] ?? "",
  );

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button type="button" className="w-full">
          Set Tournament Event URL
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Set Tournament Event URL</SheetTitle>
          <SheetDescription>Type in the event URL</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <Label className="pb-1">Event URL</Label>
          <Input
            value={eventUrl}
            onChange={(e) => setEventUrl(e.currentTarget.value)}
          ></Input>
        </div>
        <SheetFooter>
          {statusMessage}
          <Button
            type="button"
            onClick={() => {
              const oldEventId = resolveEventUrl(savedEventUrl);
              if (oldEventId) {
                getClient(savedApiKey, oldEventId.platform).abortRequest();
              }
              const eventId = resolveEventUrl(eventUrl);
              if (eventId === null) {
                setStatusMessage("Invalid URL");
                return;
              }
              setStatusMessage(`Applying event ${eventUrl}...`);
              update(eventId.url, eventId.id);
              setStatusMessage(`Applied event ${eventUrl}!`);
              clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setStatusMessage("");
                setSheetOpen(false);
              }, 1500);
            }}
          >
            Update URL
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default FetchEvent;

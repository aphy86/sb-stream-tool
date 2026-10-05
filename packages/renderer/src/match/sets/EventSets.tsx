import {
  getClient,
  getPlatformByEventUrl,
  resolveEventUrl,
} from "@renderer/platform/registry";
import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { useSettingsStore } from "@renderer/zustand/store";
import { useCreateAtom, useSelector } from "@tanstack/react-store";
import { RowSelectionState } from "@tanstack/react-table";
import { useRef, useState } from "react";
import { columns } from "@renderer/types/columns";
import { useEventSetsStore } from "@renderer/hooks/use-event-sets-store";
import { setMatchFieldValues } from "../helpers";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@renderer/components/ui/sheet";
import { Button } from "@renderer/components/ui/button";
import { Spinner } from "@renderer/components/ui/spinner";
import { DataTable } from "@renderer/components/ui/data-table";

const EventSets = withForm({
  defaultValues: MatchDefaultValues,
  props: {
    live: false,
  },
  render: function EventSetsSection({ form, live }) {
    const eventSetsStoreKey = "event-sets";
    const savedEventSlug = useSettingsStore((state) => state.eventSlug);
    const savedEventUrl = useSettingsStore((state) => state.eventUrl);
    const savedApiKey = useSettingsStore(
      (state) =>
        state.credentials[getPlatformByEventUrl(savedEventUrl).id] ?? "",
    );
    const [statusMessage, setStatusMessage] = useState("");

    const [sheetOpen, setSheetOpen] = useState(false);

    const timeoutId = useRef<NodeJS.Timeout>(undefined);
    const rowSelectionAtom = useCreateAtom<RowSelectionState>({});
    const selectedRow = useSelector(rowSelectionAtom);
    const timeSince = useRef(0);
    const [
      fetchEventSets,
      { tournamentName, sets, tableRows, totalPages, pagesLoaded, loading },
    ] = useEventSetsStore(eventSetsStoreKey);

    const applySet = () => {
      const selectedSetIndex = parseInt(Object.keys(selectedRow)[0]);

      if (Number.isNaN(selectedSetIndex) || selectedSetIndex > sets.length)
        return;

      setStatusMessage(`Applying set ${selectedSetIndex}...`);

      setMatchFieldValues(form, sets[selectedSetIndex]);

      setStatusMessage(`Applied set ${selectedSetIndex}!`);

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
          setSheetOpen(open);
          const platformId = resolveEventUrl(savedEventUrl);
          if (open === false || savedEventSlug === "" || !platformId) return;

          const timeNow = Date.now();
          if (loading && timeNow - timeSince.current <= 120000) return;

          timeSince.current = timeNow;
          getClient(savedApiKey, platformId.platform).abortRequest();

          requestAnimationFrame(() => {
            fetchEventSets(savedApiKey, platformId.platform, platformId, {
              upcomingOnly: live,
            }).catch(console.error);
          });
        }}
      >
        <SheetTrigger asChild>
          <Button disabled={savedApiKey === "" || savedEventSlug === ""}>
            Get {live === true ? "all live" : "all"} sets in{" "}
            {savedEventSlug === "" ? "event" : savedEventSlug}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex flex-col max-h-[85vh] h-full"
        >
          <SheetHeader className="flex flex-row gap-4 shrink-0">
            <div className="flex items-center">
              {loading && <Spinner className="size-8" />}
            </div>
            <div>
              <SheetTitle>All sets in {tournamentName}</SheetTitle>
              <SheetDescription>
                {loading
                  ? `Loading sets, pages ${pagesLoaded} of ${totalPages} loaded`
                  : `Pages ${pagesLoaded} of ${totalPages} loaded`}
              </SheetDescription>
            </div>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <DataTable
              columns={columns}
              rowSelectionAtom={rowSelectionAtom}
              multiRows={false}
              data={tableRows}
              className="max-h-96 min-h-0"
            />
          </div>
          <SheetFooter className="shrink-0">
            {statusMessage}
            <Button type="button" onClick={applySet}>
              Apply this set
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

export default EventSets;

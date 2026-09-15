import {
  getPlatformByEventUrl,
  platformById,
  resolveEventUrl,
} from "@renderer/platform/registry";
import { FetchProgress, PlatformSet } from "@renderer/types/platform";
import { MatchDefaultValues, withForm } from "@renderer/utils/form";
import { setFieldValues } from "@renderer/utils/helpers";
import { useSettingsStore } from "@renderer/zustand/store";
import { useCreateAtom, useSelector } from "@tanstack/react-store";
import { RowSelectionState } from "@tanstack/react-table";
import { useRef, useState } from "react";
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
import { Spinner } from "./ui/spinner";
import { DataTable } from "./ui/data-table";
import { columns } from "@renderer/types/columns";
import { SetTableEntry } from "@renderer/types/tournament";

// add concurrency to fetching
const EventSets = withForm({
  defaultValues: MatchDefaultValues,
  render: function EventSetsSection({ form }) {
    const savedEventSlug = useSettingsStore((state) => state.eventSlug);
    const savedEventUrl = useSettingsStore((state) => state.eventUrl);
    const savedApiKey = useSettingsStore(
      (state) =>
        state.credentials[getPlatformByEventUrl(savedEventUrl).id] ?? "",
    );

    const [statusMessage, setStatusMessage] = useState("");

    const [sheetOpen, setSheetOpen] = useState(false);
    const [setsFetched, setSetsFetched] = useState<PlatformSet[]>([]);

    const [loading, setLoading] = useState(false);

    const timeoutId = useRef<NodeJS.Timeout>(undefined);
    const rowSelectionAtom = useCreateAtom<RowSelectionState>({});
    const selectedRow = useSelector(rowSelectionAtom);

    const [totalPages, setTotalPages] = useState(0);
    const [pagesLoaded, setPagesLoaded] = useState(0);

    const [tournamentName, setTournamentName] = useState("Unknown Event");

    const filteredData = setsFetched.map((set) => {
      return {
        stream: set.stream,
        matchName: set.matchName,
        firstGroupName: set.entrants[0].name,
        secondGroupName: set.entrants[1].name,
      };
    }) as SetTableEntry[];

    const applySet = () => {
      const selectedSetIndex = parseInt(Object.keys(selectedRow)[0]);

      if (
        Number.isNaN(selectedSetIndex) ||
        selectedSetIndex > setsFetched.length
      )
        return;

      setStatusMessage(`Applying set ${selectedSetIndex}...`);

      setFieldValues(form, setsFetched[selectedSetIndex]);

      setStatusMessage(`Applied set ${selectedSetIndex}!`);

      clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        setStatusMessage("");
        setSheetOpen(false);
      }, 2000);
    };

    const onFetchProgress = (progress: FetchProgress) => {
      // totalPagesRef.current = progress.total;
      setTotalPages(progress.total);
      setPagesLoaded(progress.loaded);
      if (progress.loaded === 1) {
        setTournamentName(progress.tournamentName);
      }
      setSetsFetched((prevSets) =>
        progress.loaded === 1 ? progress.sets : [...prevSets, ...progress.sets],
      );
    };

    const fetchSets = async () => {
      const eventId = resolveEventUrl(savedEventUrl);

      if (!eventId) return;

      setLoading(true);

      await platformById(eventId.platform).withApiKey(savedApiKey).getSets(
        eventId,
        {
          upcomingOnly: false,
        },
        onFetchProgress,
      );

      setLoading(false);
    };
    return (
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (open === false || savedEventSlug === "") return;

          fetchSets().catch((reason) => console.log(reason));
        }}
      >
        <SheetTrigger asChild>
          <Button disabled={savedApiKey === "" || savedEventSlug === ""}>
            Get all sets in {savedEventSlug === "" ? "event" : savedEventSlug}
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
              data={filteredData}
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

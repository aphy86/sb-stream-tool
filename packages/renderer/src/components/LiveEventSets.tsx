// import {
//   changeSetFormat,
//   getSetFormat,
//   isInPlacementList,
// } from "@renderer/utils/helpers";
// import { useSettingsStore } from "@renderer/zustand/store";
// import { useRef, useState } from "react";
// import {
//   Sheet,
//   SheetClose,
//   SheetContent,
//   SheetDescription,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "./ui/sheet";
// import { Button } from "./ui/button";
// import { SetTableEntry } from "@renderer/types/tournament";
// import { DataTable } from "./ui/data-table";
// import { columns } from "@renderer/types/columns";
// import { RowSelectionState } from "@tanstack/react-table";
// import { useFormContext } from "react-hook-form";
// import { Tournament } from "@app/common";
// import { usePlayerFormFieldArrayContext } from "../hooks/use-player-form-field-array-context";
// import {
//   getPlatformByEventUrl,
//   platformById,
//   resolveEventUrl,
// } from "@renderer/platform/registry";
// import { FetchProgress, PlatformSet } from "@renderer/platform/types";
// import { useCreateAtom, useSelector } from "@tanstack/react-store";
// import { Spinner } from "./ui/spinner";

// function LiveEventSets() {
//   const savedEventSlug = useSettingsStore((state) => state.eventSlug);
//   const savedEventUrl = useSettingsStore((state) => state.eventUrl);
//   const savedApiKey = useSettingsStore(
//     (state) => state.credentials[getPlatformByEventUrl(savedEventUrl).id] ?? "",
//   );
//   const currentEventSlug = useRef("");
//   const totalPagesRef = useRef(1); // for the for loop
//   const [pagesLoaded, setPagesLoaded] = useState(0);
//   const [sheetOpen, setSheetOpen] = useState(false);
//   const [setsFetched, setSetsFetched] = useState<PlatformSet[]>([]);
//   const [tournamentName, setTournamentName] = useState("unknown event");
//   const [totalPagesState, setTotalPagesState] = useState(0); // for ui rendering
//   const rowSelectionAtom = useCreateAtom<RowSelectionState>({});
//   const selectedRow = useSelector(rowSelectionAtom);
//   const filteredData = setsFetched.map((set) => {
//     return {
//       stream: set.stream,
//       matchName: set.matchName,
//       firstGroupName: set.entrants[0].name,
//       secondGroupName: set.entrants[1].name,
//     };
//   }) as SetTableEntry[];
//   const { setValue, getValues } = useFormContext<Tournament>();
//   const teams = usePlayerFormFieldArrayContext();
//   const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
//   const [statusMessage, setStatusMessage] = useState(""); // status messages (applying set, errors, etc)
//   const [loading, setLoading] = useState(true);

//   const apply = () => {
//     const selectedSetIndex = parseInt(Object.keys(selectedRow)[0]);
//     if (
//       Number.isNaN(selectedSetIndex) ||
//       setsFetched[selectedSetIndex].entrants.length <= 0
//     ) {
//       return;
//     }
//     const setFormat = getSetFormat(
//       getValues("teams.0.players").length, // each team's player count are guaranteed to be the same
//       setsFetched[selectedSetIndex].entrants[0].players.length, // all sets are guaranteed to be the same
//     );
//     changeSetFormat(setFormat, teams);
//     setValue("setFormat", setFormat);
//     setValue("name", tournamentName);
//     const setRoundFormat = setsFetched[selectedSetIndex].matchName;
//     const regex = /^(?:Winners|Losers) Round \d+$/;
//     if (regex.test(setRoundFormat)) {
//       const splitRoundFormat = setRoundFormat.split(" "); // only known way to get the numeric value
//       setValue("roundFormat", `${splitRoundFormat[0]} ${splitRoundFormat[1]}`);
//       setValue("roundNumber", parseInt(splitRoundFormat[2]) ?? 0);
//     } else {
//       if (isInPlacementList(setRoundFormat)) {
//         setValue("roundFormat", setRoundFormat);
//         setValue("customRoundFormat", "");
//       } else {
//         setValue("roundFormat", "Custom Match");
//         setValue("customRoundFormat", setRoundFormat);
//       }
//       setValue("roundNumber", 0);
//     }

//     for (let i = 0; i < getValues("teams").length; i++) {
//       for (let j = 0; j < getValues(`teams.${i}.players`).length; j++) {
//         setValue(`teams.${i}.players.${j}.playerInfo`, {
//           teamName:
//             setsFetched[selectedSetIndex].entrants[i].players[j].teamName,
//           playerTag:
//             setsFetched[selectedSetIndex].entrants[i].players[j].playerTag,
//           pronouns:
//             setsFetched[selectedSetIndex].entrants[i].players[j].pronouns,
//           twitter: setsFetched[selectedSetIndex].entrants[i].players[j].twitter,
//         });
//       }
//     }
//     setStatusMessage(`Applying Set ${selectedSetIndex}...`);

//     clearTimeout(timeoutRef.current);
//     timeoutRef.current = setTimeout(() => {
//       setStatusMessage("");
//       setSheetOpen(false);
//     }, 2000);
//   };

//   const onFetchProgress = (progress: FetchProgress) => {
//     totalPagesRef.current = progress.total;
//     setTotalPagesState(progress.total);
//     setPagesLoaded(progress.loaded);
//     if (progress.loaded === 1) {
//       setTournamentName(progress.tournamentName);
//     }
//     setSetsFetched((prevSets) =>
//       progress.loaded === 1 ? progress.sets : [...prevSets, ...progress.sets],
//     );
//   };

//   const fetchSets = async () => {
//     const eventId = resolveEventUrl(savedEventUrl);
//     if (!eventId) {
//       return;
//     }

//     setLoading(true);

//     await platformById(eventId.platform)
//       .withApiKey(savedApiKey)
//       .getSets(eventId, { upcomingOnly: true }, onFetchProgress);

//     setLoading(false);
//   };

//   return (
//     <Sheet
//       open={sheetOpen}
//       onOpenChange={(open) => {
//         setSheetOpen(open);
//         if (
//           open == false ||
//           savedEventSlug === "" ||
//           currentEventSlug.current === savedEventSlug // ensure that you dont fetch the same set again while its loading
//         ) {
//           return;
//         }

//         currentEventSlug.current = savedEventSlug;
//         fetchSets().catch((reason) => console.log(reason));
//       }}
//     >
//       <SheetTrigger asChild>
//         <Button disabled={savedApiKey === "" || savedEventSlug === ""}>
//           Get all live sets in{" "}
//           {savedEventSlug === "" ? "event" : savedEventSlug}
//         </Button>
//       </SheetTrigger>
//       <SheetContent side="bottom">
//         <SheetHeader className="flex flex-row gap-4">
//           <div className="flex items-center">
//             {loading && <Spinner className="size-8" />}
//           </div>
//           <div>
//             <SheetTitle>All live sets in {tournamentName}</SheetTitle>
//             <SheetDescription>
//               {loading
//                 ? `Loading sets, pages ${pagesLoaded} of ${totalPagesState} loaded`
//                 : `Pages ${pagesLoaded} of ${totalPagesState} loaded`}
//             </SheetDescription>
//           </div>
//         </SheetHeader>
//         <div>
//           <DataTable
//             columns={columns}
//             data={filteredData}
//             rowSelectionAtom={rowSelectionAtom}
//             multiRows={false}
//           />
//         </div>
//         <SheetFooter>
//           {statusMessage}
//           <Button type="button" onClick={apply}>
//             Apply this set
//           </Button>
//           <SheetClose asChild>
//             <Button variant="outline">Close</Button>
//           </SheetClose>
//         </SheetFooter>
//       </SheetContent>
//     </Sheet>
//   );
// }

// export default LiveEventSets;

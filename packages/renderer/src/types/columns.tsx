"use client";

import { createAppColumnHelper } from "@renderer/components/ui/data-table";
import { SetTableEntry } from "./event-sets";
import { Checkbox } from "@renderer/components/ui/checkbox";

const columnHelper = createAppColumnHelper<SetTableEntry>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  }),
  columnHelper.accessor("stream", {
    header: "Stream",
  }),
  columnHelper.accessor("matchName", {
    header: "Match Name",
  }),
  columnHelper.accessor("firstGroupName", {
    header: "Group 1",
  }),
  columnHelper.accessor("secondGroupName", {
    header: "Group 2",
  }),
]);

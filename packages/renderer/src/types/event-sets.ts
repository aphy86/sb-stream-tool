// import type { PlayerInfo } from "@app/common";

import { EventSetsStore } from "@renderer/lib/EventSetsStore";

// export type Set = {
//   stream: string;
//   matchName: string;
//   status: number;
//   groups: {
//     name: string;
//     players: PlayerInfo[]; // always gonna be of size 2
//   }[];
// };

export type SetTableEntry = {
  stream: string;
  matchName: string;
  firstGroupName: string;
  secondGroupName: string;
};

export type EventSetsProviderProps = {
  children: React.ReactNode;
  eventSetsStore?: EventSetsStore;
};

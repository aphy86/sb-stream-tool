// import type { PlayerInfo } from "@app/common";

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

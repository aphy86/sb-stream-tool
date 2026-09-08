import { Action, placements, Tournament, type SlippiPlayer } from "@app/common";

import type { SetEntry, SetFormat } from "@renderer/types/tournament";
import {
  UseFormGetValues,
  UseFormSetValue,
  type UseFieldArrayReturn,
} from "react-hook-form";
import { updateOverlay } from "@app/preload";
import {
  EventSetsQuery,
  LiveEventSetsQuery,
} from "@renderer/types/__generated__/graphql-types";

export const tailwindBorderColorLookup = {
  red: "border-red-500",
  blue: "border-blue-500",
  green: "border-green-500",
};
export const getValueWithinRange = (
  value: number,
  max: number,
  min: number,
) => {
  // getNum does the same thing in spinbox, but since that's a ui component, it would feel wrong to import this function there, rather than just declaring it in that ui component
  if (Number.isNaN(value)) {
    return NaN;
  }
  if (value > max) {
    return max;
  }
  if (value < min) {
    return min;
  }
  return value;
};

export const ActionToName: Record<Action, string> = {
  home: "Home",
  submit: "Submit to overlay",
  "score-up": "Increase team score by 1",
  "score-down": "Decrease team score by 1",
  "obs-quick-reconnect": "Quick Reconnect to OBS Websocket",
  "obs-disconnect": "Disconnect from OBS Websocket",
  "reset-score-global": "Reset both teams' scores",
  "team-left-score-up": "Increase left team's score by 1",
  "team-right-score-up": "Increase right team's score by 1",
  "team-left-score-down": "Decrease left team's score by 1",
  "team-right-score-down": "Decrease left team's score by 1",
};

export const onSubmit = (data: Tournament) => {
  console.log(data);
  updateOverlay(data).catch((error) => console.log(error));
};

// export const getBorderColor = (setFormat: SetFormat)
export const sleep = (ms: number): Promise<unknown> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function isInPlacementList(placement: string): boolean {
  for (const p of placements) {
    if (p === placement) {
      return true;
    }
  }
  return false;
}

export function filterLiveSets(
  data:
    | NonNullable<NonNullable<LiveEventSetsQuery["event"]>["sets"]>["nodes"]
    | undefined,
): SetEntry[] {
  const filteredSets = [] as SetEntry[];
  if (!data || data === null || data === undefined) {
    return [];
  }
  // iterate through every set
  for (const node of data) {
    if (node?.state && node.slots) {
      const groupInfo = [] as SetEntry["groups"];
      // iterate through every "player entry" in a specific set
      for (const slot of node.slots) {
        if (slot?.entrant?.participants) {
          groupInfo.push({
            name: slot.entrant.name ?? "",
            // get every actual player in the "player entry"
            players: slot.entrant.participants?.map((participant) => {
              return {
                teamName: participant?.prefix ?? "",
                playerTag: participant?.gamerTag ?? "",
                pronouns: participant?.user?.genderPronoun ?? "",
                twitter:
                  participant?.user?.authorizations?.[0]?.externalUsername ??
                  "",
              };
            }),
          });
        }
      }
      // no point including a set where there's literally no available information about the players (e.g. winner of AD vs winner of BC like who tf)
      if (groupInfo.length > 0) {
        // make sure there is always sets of size 2
        while (groupInfo.length < 2) {
          groupInfo.push({
            name: "",
            // groupInfo can safely be assumed to be at least size 1
            players: groupInfo[0].players.map(() => {
              return {
                teamName: "",
                playerTag: "",
                pronouns: "",
                twitter: "",
              };
            }),
          });
        }
        filteredSets.push({
          stream: node.stream?.streamName ?? "",
          matchName: node.fullRoundText ?? "Custom Round Name",
          status: node.state,
          groups: groupInfo,
        });
      }
    }
  }

  return filteredSets;
}

export function filterSets(
  data:
    | NonNullable<NonNullable<EventSetsQuery["event"]>["sets"]>["nodes"]
    | undefined,
): SetEntry[] {
  const filteredSets = [] as SetEntry[];
  if (!data || data === null || data === undefined) {
    return [];
  }
  // iterate through every set
  for (const node of data) {
    if (node?.state && node.slots) {
      const groupInfo = [] as SetEntry["groups"];
      // iterate through every "player entry" in a specific set
      for (const slot of node.slots) {
        if (slot?.entrant?.participants) {
          groupInfo.push({
            name: slot.entrant.name ?? "",
            // get every actual player in the "player entry"
            players: slot.entrant.participants?.map((participant) => {
              return {
                teamName: participant?.prefix ?? "",
                playerTag: participant?.gamerTag ?? "",
                pronouns: participant?.user?.genderPronoun ?? "",
                twitter:
                  participant?.user?.authorizations?.[0]?.externalUsername ??
                  "",
              };
            }),
          });
        }
      }
      // no point including a set where there's literally no available information about the players (e.g. winner of AD vs winner of BC like who tf)
      if (groupInfo.length > 0) {
        // make sure there is always sets of size 2
        while (groupInfo.length < 2) {
          groupInfo.push({
            name: "",
            // groupInfo can safely be assumed to be at least size 1
            players: groupInfo[0].players.map(() => {
              return {
                teamName: "",
                playerTag: "",
                pronouns: "",
                twitter: "",
              };
            }),
          });
        }
        filteredSets.push({
          stream: node.stream?.streamName ?? "",
          matchName: node.fullRoundText ?? "Custom Round Name",
          status: node.state,
          groups: groupInfo,
        });
      }
    }
  }

  return filteredSets;
}

// // updates the player form for doubles or singles
// export function updatePlayerForm(
//   setFormat: SetFormat,
//   currentSetFormat: SetFormat,
//   teams: UseFieldArrayReturn[]
// ): void {
//   if (setFormat !== currentSetFormat) {
//     changeSetFormat(setFormat, teams)
//   }
// }

export function getSetFormat(
  numPlayersInForm: number | undefined,
  numPlayersInSet: number | undefined,
): SetFormat {
  const numPlayersToSetFormat: Record<number, SetFormat> = {
    1: "Singles",
    2: "Doubles",
  };
  if (
    !numPlayersInForm ||
    !numPlayersInSet ||
    numPlayersInForm > numPlayersInSet
  ) {
    return "Singles";
  }
  if (numPlayersInForm === numPlayersInSet) {
    return numPlayersToSetFormat[numPlayersInSet];
  }
  return "Doubles";
}
export function changeSetFormat(
  setFormat: string,
  teams: UseFieldArrayReturn[],
): void {
  switch (setFormat) {
    case "Singles":
      for (let i = 0; i < teams.length; i++) {
        teams[i].remove(1);
      }
      break;
    case "Doubles":
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].fields.length < 2) {
          teams[i].append({
            playerInfo: {
              teamName: "",
              playerTag: "",
              pronouns: "",
              twitter: "",
            },
            gameInfo: {
              character: "Random",
              altCostume: "Default",
              port: 2 + i,
            },
          });
        }
      }
      break;
    default:
      throw new Error(`Set format ${setFormat} does not exist!`);
  }
}

export function findTeamWinner(
  players: SlippiPlayer[][],
  winner: number,
): number {
  for (let i = 0; i < players.length; i++) {
    for (const player of players[i]) {
      if (player.playerId === winner) {
        return i;
      }
    }
  }
  return -1;
}

// kept for later purposes
// export function findSlippiWinner(
//   teams: SlippiPlayer[][], // always guaranteed to be of at least size 1 per array index, but still handled in the method just in case
//   isTeams: boolean,
//   winner: number,
// ) {
//   for (let i = 0; i < teams.length; i++) {
//     if (isTeams && teams[i].length > 0 && teams[i][0].playerId === winner) {
//       return i;
//     }
//     if (!isTeams && teams[i].length > 0 && teams[i][0].teamId === winner) {
//       return i;
//     }
//   }
//   return -1; // theoretically not possible
// }

export function findSlippiWinner(
  winners: number[],
  getValues: UseFormGetValues<Tournament>,
) {
  if (winners.length > 0) {
    for (let i = 0; i < getValues("teams").length; i++) {
      for (let j = 0; j < getValues(`teams.${i}.players`).length; j++) {
        if (
          getValues(`teams.${i}.players.${j}.gameInfo.port`) ===
          winners[0] + 1 // always gonna have at least 1 winner, so why not compare it with the first winner player index since its always guaranteed to exist?
        ) {
          return i;
        }
      }
    }
  }
  return undefined;
}

export function resetAllScores(
  getValues: UseFormGetValues<Tournament>,
  setValue: UseFormSetValue<Tournament>,
) {
  for (let i = 0; i < getValues("teams").length; i++) {
    setValue(`teams.${i}.score`, 0);
  }
}

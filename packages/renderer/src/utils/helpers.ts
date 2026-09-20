import {
  Action,
  Match,
  Placement,
  placements,
  Team,
  type SlippiPlayer,
} from "@app/common";

import type {
  SetEntry,
  SetFormat,
  SetTableEntry,
} from "@renderer/types/tournament";
import { updateOverlay } from "@app/preload";
import {
  EventSetsQuery,
  LiveEventSetsQuery,
} from "@renderer/types/__generated__/graphql-types";
import { PlatformSet } from "@renderer/types/platform";

export const tailwindTeamBorderColorLookup = {
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

export const onSubmit = (data: Match) => {
  console.log(data);
  updateOverlay(data).catch((error) => console.log(error));
};

// export const getBorderColor = (setFormat: SetFormat)

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
                socials: [
                  {
                    platform: "twitter",
                    username:
                      participant?.user?.authorizations?.[0]
                        ?.externalUsername ?? "",
                  },
                ],
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
                socials: [{ platform: "", username: "" }],
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
                socials: [
                  {
                    platform: "twitter",
                    username:
                      participant?.user?.authorizations?.[0]
                        ?.externalUsername ?? "",
                  },
                ],
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
                socials: [{ platform: "", username: "" }],
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

// export function getSetFormat(
//   numPlayersInForm: number | undefined,
//   numPlayersInSet: number | undefined,
// ): SetFormat {
//   const numPlayersToSetFormat: Record<number, SetFormat> = {
//     1: "Singles",
//     2: "Doubles",
//   };
//   if (
//     !numPlayersInForm ||
//     !numPlayersInSet ||
//     numPlayersInForm > numPlayersInSet
//   ) {
//     return "Singles";
//   }
//   if (numPlayersInForm === numPlayersInSet) {
//     return numPlayersToSetFormat[numPlayersInSet];
//   }
//   return "Doubles";
// }
// export function changeSetFormat(
//   setFormat: string,
//   teams: UseFieldArrayReturn[],
// ): void {
//   switch (setFormat) {
//     case "Singles":
//       for (let i = 0; i < teams.length; i++) {
//         teams[i].remove(1);
//       }
//       break;
//     case "Doubles":
//       for (let i = 0; i < teams.length; i++) {
//         if (teams[i].fields.length < 2) {
//           teams[i].append({
//             playerInfo: {
//               teamName: "",
//               playerTag: "",
//               pronouns: "",
//               twitter: "",
//             },
//             gameInfo: {
//               character: "Random",
//               altCostume: "Default",
//               port: 2 + i,
//             },
//           });
//         }
//       }
//       break;
//     default:
//       throw new Error(`Set format ${setFormat} does not exist!`);
//   }
// }

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

export function getSetType(set: PlatformSet): SetFormat {
  if (
    set.entrants[0].players.length === 2 &&
    set.entrants[1].players.length === 2
  )
    return "Doubles";
  return "Singles";
}

export function parseMatchName(matchName: string): {
  matchFormat: string;
  round: string | null;
  customMatchName: string | null;
} {
  const isRound = /^(Winners Round|Losers Round)/;
  if (isRound.test(matchName)) {
    const parsedMatchName = matchName.split(" ");
    const roundNum = parsedMatchName.slice(2).join(" ");
    return {
      matchFormat: `${parsedMatchName[0]} ${parsedMatchName[1]}`,
      round: roundNum,
      customMatchName: null,
    };
  }
  if (placements.includes(matchName as Placement)) {
    return {
      matchFormat: matchName,
      round: null,
      customMatchName: null,
    };
  }
  return {
    matchFormat: "Custom Match",
    round: null,
    customMatchName: matchName,
  };
}

// tanstack form typing moment lol
export function setFieldValues(form: any, set: PlatformSet) {
  form.setFieldValue("tournamentName", set.tournamentName);

  const setFormat = getSetType(set);

  if (setFormat === "Doubles") {
    form.setFieldValue(`teams[${0}].name`, set.entrants[0].name);
    form.setFieldValue(`teams[${1}].name`, set.entrants[1].name);
  }

  form.setFieldValue("setFormat", setFormat);

  const parsedMatchName = parseMatchName(set.matchName);
  form.setFieldValue("roundFormat", parsedMatchName.matchFormat);

  if (parsedMatchName.round) {
    form.setFieldValue("roundNumber", parsedMatchName.round);
  }

  if (parsedMatchName.customMatchName) {
    form.setFieldValue("customRoundFormat", parsedMatchName.customMatchName);
  }

  // PlatformSet entrants will always be of length 2
  for (let i = 0; i < 2; i++) {
    let numProcessed = 0;
    for (let j = 0; j < form.getFieldValue(`teams[${i}].players`).length; j++) {
      form.setFieldValue(`teams[${i}].players[${j}].playerInfo`, {
        teamName: set.entrants[i].players[j].teamName,
        playerTag: set.entrants[i].players[j].playerTag,
        pronouns: set.entrants[i].players[j].pronouns,
        socials: set.entrants[i].players[j].socials,
      });
      numProcessed++;
    }

    for (let k = numProcessed; k < set.entrants[i].players.length; k++) {
      form.pushFieldValue(`teams[${i}].players`, {
        playerInfo: {
          teamName: set.entrants[i].players[k].teamName,
          playerTag: set.entrants[i].players[k].playerTag,
          pronouns: set.entrants[i].players[k].pronouns,
          socials: set.entrants[i].players[k].socials,
        },
        gameInfo: {
          character: "Random",
          altCostume: "Default",
          port: 1,
        },
      });
    }
  }
}

export function findSlippiWinner(winners: number[], teams: Team[]) {
  if (winners.length > 0) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams[i].players.length; j++) {
        if (
          teams[i].players[j].gameInfo.port ===
          winners[0] + 1 // always gonna have at least 1 winner, so why not compare it with the first winner player index since its always guaranteed to exist?
        ) {
          return i;
        }
      }
    }
  }
  return undefined;
}

// export function resetAllScores(
//   getValues: UseFormGetValues<Tournament>,
//   setValue: UseFormSetValue<Tournament>,
// ) {
//   for (let i = 0; i < getValues("teams").length; i++) {
//     setValue(`teams.${i}.score`, 0);
//   }
// }

export function getExponentialBackoff(attempt: number) {
  const base = 1000;

  const exp = base * 2 ** attempt;

  const jitter = Math.random() * 500;

  return Math.min(exp + jitter, 30000);
}

export function mapSetToTableRow(set: PlatformSet): SetTableEntry {
  return {
    stream: set.stream,
    matchName: set.matchName,
    firstGroupName: set.entrants[0].name,
    secondGroupName: set.entrants[1].name,
  };
}

export function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: unknown }).name === "AbortError")
  );
}

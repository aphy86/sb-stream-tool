import { Player } from "@app/common";
import { PlatformSet } from "@renderer/types/platform";
import { RoundType, roundTypes, SetFormat } from "@app/common";

export function swapCharacters(form: any, start: number, end: number) {
  const teamsLength = form.getFieldValue("teams").length - 1;
  if (start < 0 || end > teamsLength) return;
  const teamStartGameInfo = form
    .getFieldValue(`teams[${start}].players`)
    .map((player: Player) => player.gameInfo);
  const teamEndGameInfo = form
    .getFieldValue(`teams[${end}].players`)
    .map((player: Player) => player.gameInfo);

  for (let i = 0; i < teamEndGameInfo.length; i++) {
    if (i < form.getFieldValue(`teams[${start}].players`).length) {
      form.setFieldValue(
        `teams[${start}].players[${i}].gameInfo`,
        teamEndGameInfo[i],
      );
    }
  }
  for (let j = 0; j < teamStartGameInfo.length; j++) {
    if (j < form.getFieldValue(`teams[${start}].players`).length) {
      form.setFieldValue(
        `teams[${end}].players[${j}].gameInfo`,
        teamStartGameInfo[j],
      );
    }
  }
}

// tanstack form typing moment lol
export function setMatchFieldValues(form: any, set: PlatformSet) {
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

// export function filterSets(
//   data:
//     | NonNullable<NonNullable<EventSetsQuery["event"]>["sets"]>["nodes"]
//     | undefined,
// ): SetEntry[] {
//   const filteredSets = [] as SetEntry[];
//   if (!data || data === null || data === undefined) {
//     return [];
//   }
//   // iterate through every set
//   for (const node of data) {
//     if (node?.state && node.slots) {
//       const groupInfo = [] as SetEntry["groups"];
//       // iterate through every "player entry" in a specific set
//       for (const slot of node.slots) {
//         if (slot?.entrant?.participants) {
//           groupInfo.push({
//             name: slot.entrant.name ?? "",
//             // get every actual player in the "player entry"
//             players: slot.entrant.participants?.map((participant) => {
//               return {
//                 teamName: participant?.prefix ?? "",
//                 playerTag: participant?.gamerTag ?? "",
//                 pronouns: participant?.user?.genderPronoun ?? "",
//                 socials: [
//                   {
//                     platform: "twitter",
//                     username:
//                       participant?.user?.authorizations?.[0]
//                         ?.externalUsername ?? "",
//                   },
//                 ],
//               };
//             }),
//           });
//         }
//       }
//       // no point including a set where there's literally no available information about the players (e.g. winner of AD vs winner of BC like who tf)
//       if (groupInfo.length > 0) {
//         // make sure there is always sets of size 2
//         while (groupInfo.length < 2) {
//           groupInfo.push({
//             name: "",
//             // groupInfo can safely be assumed to be at least size 1
//             players: groupInfo[0].players.map(() => {
//               return {
//                 teamName: "",
//                 playerTag: "",
//                 pronouns: "",
//                 socials: [{ platform: "", username: "" }],
//               };
//             }),
//           });
//         }
//         filteredSets.push({
//           stream: node.stream?.streamName ?? "",
//           matchName: node.fullRoundText ?? "Custom Round Name",
//           status: node.state,
//           groups: groupInfo,
//         });
//       }
//     }
//   }

//   return filteredSets;
// }

// export function filterLiveSets(
//   data:
//     | NonNullable<NonNullable<LiveEventSetsQuery["event"]>["sets"]>["nodes"]
//     | undefined,
// ): SetEntry[] {
//   const filteredSets = [] as SetEntry[];
//   if (!data || data === null || data === undefined) {
//     return [];
//   }
//   // iterate through every set
//   for (const node of data) {
//     if (node?.state && node.slots) {
//       const groupInfo = [] as SetEntry["groups"];
//       // iterate through every "player entry" in a specific set
//       for (const slot of node.slots) {
//         if (slot?.entrant?.participants) {
//           groupInfo.push({
//             name: slot.entrant.name ?? "",
//             // get every actual player in the "player entry"
//             players: slot.entrant.participants?.map((participant) => {
//               return {
//                 teamName: participant?.prefix ?? "",
//                 playerTag: participant?.gamerTag ?? "",
//                 pronouns: participant?.user?.genderPronoun ?? "",
//                 socials: [
//                   {
//                     platform: "twitter",
//                     username:
//                       participant?.user?.authorizations?.[0]
//                         ?.externalUsername ?? "",
//                   },
//                 ],
//               };
//             }),
//           });
//         }
//       }
//       // no point including a set where there's literally no available information about the players (e.g. winner of AD vs winner of BC like who tf)
//       if (groupInfo.length > 0) {
//         // make sure there is always sets of size 2
//         while (groupInfo.length < 2) {
//           groupInfo.push({
//             name: "",
//             // groupInfo can safely be assumed to be at least size 1
//             players: groupInfo[0].players.map(() => {
//               return {
//                 teamName: "",
//                 playerTag: "",
//                 pronouns: "",
//                 socials: [{ platform: "", username: "" }],
//               };
//             }),
//           });
//         }
//         filteredSets.push({
//           stream: node.stream?.streamName ?? "",
//           matchName: node.fullRoundText ?? "Custom Round Name",
//           status: node.state,
//           groups: groupInfo,
//         });
//       }
//     }
//   }

//   return filteredSets;
// }

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
  if (roundTypes.includes(matchName as RoundType)) {
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

export const tailwindTeamBorderColorLookup = {
  red: "border-red-500",
  blue: "border-blue-500",
  green: "border-green-500",
};

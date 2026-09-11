import type { Match, Team } from "@app/common";
import { fieldContext, formContext } from "@renderer/hooks/contexts";
import { createFormHook } from "@tanstack/react-form";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});

export const MatchDefaultValues: Match = {
  tournamentName: "",
  bestOf: 1,
  roundFormat: "Friendlies",
  customRoundFormat: "",
  roundNumber: 0,
  setFormat: "Singles",
  teams: [
    {
      name: "Team 1",
      score: 0,
      inLosers: false,
      color: undefined,
      players: [
        {
          playerInfo: {
            teamName: "",
            playerTag: "",
            pronouns: "",
            socials: [],
          },
          gameInfo: {
            character: "Random",
            altCostume: "Default",
            port: 1,
          },
        },
      ],
    },
    {
      name: "Team 2",
      score: 0,
      inLosers: false,
      color: undefined,
      players: [
        {
          playerInfo: {
            teamName: "",
            playerTag: "",
            pronouns: "",
            socials: [],
          },
          gameInfo: {
            character: "Random",
            altCostume: "Default",
            port: 2,
          },
        },
      ],
    },
  ],
  commentators: [
    { name: "", pronouns: "", socials: [{ platform: "", username: "" }] },
  ],
};

export const getTeamState = (teams: Team[]) => {
  const t = [] as Team[];
  for (const team of teams) {
    t.push({
      name: team.name,
      score: team.score,
      inLosers: team.inLosers,
      players: team.players,
    });
  }
  return t;
};

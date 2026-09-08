import type { Team, Tournament } from "@app/common";

export const TournamentDefaultValues: Tournament = {
  name: "",
  bestOf: 1,
  roundFormat: "Friendlies",
  customRoundFormat: "",
  roundNumber: undefined,
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
            twitter: "",
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
            twitter: "",
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
  commentators: [{ name: "", pronouns: "", twitter: "" }],
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

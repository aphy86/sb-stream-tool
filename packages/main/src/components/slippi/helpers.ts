import { SlippiGameData, SlippiPlayer } from "@app/common";
import {
  FrameEntryType,
  GameEndMethod,
  GameEndType,
  GameStartType,
  PlayerType,
  characters as characterUtils,
} from "@slippi/slippi-js/node";

const slippiPlayerKey = (player: SlippiPlayer) =>
  `${player.port}:${player.playerId}:${player.teamId}:${player.character}:${player.color}`;

export function getSlippiGameKey(game: SlippiGameData) {
  return `${game.isTeams}|${game.players.map((team) => team.map(slippiPlayerKey).join(",")).join("/")}`;
}

// singles players will have their own individual teams
type Roster = {
  teamByPlayer: Map<number, number>;
  playersByTeam: Map<number, number[]>;
};

type TeamStanding = {
  team: number;
  stocks: number;
  percent: number;
};

function getRoster(settings: GameStartType): Roster {
  const teamByPlayer = new Map<number, number>();
  const playersByTeam = new Map<number, number[]>();

  for (const { playerIndex, teamId } of settings.players) {
    const team = settings.isTeams ? teamId : playerIndex;
    if (team !== undefined) {
      teamByPlayer.set(playerIndex, team);
      const players = playersByTeam.get(team) ?? [];
      players.push(playerIndex);
      playersByTeam.set(team, players);
    }
  }

  return { teamByPlayer, playersByTeam };
}

/**
 * inspired by slippi-js's getWinners function: https://github.com/project-slippi/slippi-js/blob/master/src/common/utils/getWinners.ts
 *
 * returns all winners' playerIndexes in an array
 */
export function getWinners(
  settings: GameStartType | undefined | null,
  lastFrame: FrameEntryType | undefined | null,
  gameEnd: GameEndType | undefined | null,
): number[] {
  if (!settings || !gameEnd) return [];

  const { teamByPlayer, playersByTeam } = getRoster(settings);

  const getPlayersInTeam = (team: number | undefined) =>
    team === undefined ? [] : (playersByTeam.get(team) ?? []);

  // quit-out scenario, give the win to the name who didn't quit out
  if (
    gameEnd.gameEndMethod === GameEndMethod.NO_CONTEST ||
    gameEnd.gameEndMethod === GameEndMethod.UNRESOLVED
  ) {
    const quitterTeam = teamByPlayer.get(gameEnd.lrasInitiatorIndex ?? -1);
    const [winningTeam, ...extraTeams] = [...playersByTeam.keys()].filter(
      (s) => s !== quitterTeam,
    );
    return quitterTeam === undefined || extraTeams.length > 0
      ? []
      : getPlayersInTeam(winningTeam);
  }

  // get all actual players in the game (e.g. no nana)
  const actualPlayers = Object.values(lastFrame?.players ?? {}).flatMap((p) =>
    p?.post && !p.post.isFollower ? [p.post] : [],
  );

  // both teams lost their last stock at the same time
  if (
    actualPlayers.length > 0 &&
    actualPlayers.every((p) => p.stocksRemaining === 0)
  ) {
    return [];
  }

  // timeout
  if (
    (!gameEnd.gameEndMethod || gameEnd.gameEndMethod === GameEndMethod.TIME) &&
    actualPlayers.length >= 2
  ) {
    const allTeamStandings = new Map<number, TeamStanding>();

    for (const player of actualPlayers) {
      const team = teamByPlayer.get(player.playerIndex ?? -1);
      if (team !== undefined) {
        const standing = allTeamStandings.get(team) ?? {
          team,
          stocks: 0,
          percent: 0,
        };
        standing.stocks += player.stocksRemaining ?? 0;
        standing.percent += player.percent ?? 0;
        allTeamStandings.set(team, standing);
      }
    }

    const [bestTeam, nextBestTeam] = [...allTeamStandings.values()].sort(
      (a, b) => b.stocks - a.stocks || a.percent - b.percent,
    );

    const isTie =
      nextBestTeam &&
      bestTeam.stocks === nextBestTeam.stocks &&
      bestTeam.percent === nextBestTeam.percent;

    return !bestTeam || isTie ? [] : getPlayersInTeam(bestTeam.team);
  }

  const firstPlace = gameEnd.placements.find((p) => p.position === 0);
  return firstPlace
    ? getPlayersInTeam(teamByPlayer.get(firstPlace.playerIndex))
    : [];
}

const CHARACTER_IDS = new Set(
  characterUtils.getAllCharacters("playable").map((c) => c.id),
);

function toSlippiPlayer(player: PlayerType): SlippiPlayer | undefined {
  if (
    player.characterId === undefined ||
    !CHARACTER_IDS.has(player.characterId)
  )
    return undefined;

  return {
    character: characterUtils.getCharacterName(player.characterId),
    color: characterUtils.getCharacterColorName(
      player.characterId,
      player.characterColor ?? 0,
    ),
    playerId: player.playerIndex,
    port: player.port,
    teamId: player.teamId ?? -1,
    teamShade: player.teamShade,
  };
}

export function getStartGameData(
  settings: GameStartType,
): SlippiGameData | undefined {
  const players: SlippiPlayer[] = [];
  for (const player of settings.players) {
    const slippiPlayer = toSlippiPlayer(player);
    if (!slippiPlayer) return undefined;
    players.push(slippiPlayer);
  }

  if (!settings.isTeams) {
    return { isTeams: false, players: players.map((player) => [player]) };
  }

  const teams = Map.groupBy(players, (p) => p.teamId);

  return {
    isTeams: true,
    players: [...teams.values()].map((team) => team.slice(0, 3)), // slice ensures each team will have at MOST 3 players
  };
}

export function isActualGame(
  lastFrame: number | null | undefined,
  allDamageDealt: number,
) {
  return (
    lastFrame !== null &&
    lastFrame !== undefined &&
    lastFrame > 6000 &&
    allDamageDealt > 250
  );
}

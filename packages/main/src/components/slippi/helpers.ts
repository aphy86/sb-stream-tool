import { SlippiGameData, SlippiPlayer } from "@app/common";
import {
  FrameEntryType,
  GameEndMethod,
  GameEndType,
  GameStartType,
  PlayerType,
  PostFrameUpdateType,
  characters as characterUtils,
} from "@slippi/slippi-js/node";
import { TeamAggregate } from "../../types.js";

const slippiPlayerKey = (player: SlippiPlayer) =>
  `${player.port}:${player.playerId}:${player.teamId}:${player.character}:${player.color}`;

export function getSlippiGameKey(game: SlippiGameData) {
  return `${game.isTeams}|${game.players.map((team) => team.map(slippiPlayerKey).join(",")).join("/")}`;
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
  if (!settings || !lastFrame || !gameEnd) return [];

  // filter out followers (e.g. nana)

  const actualPlayers = Object.values(lastFrame.players).flatMap((player) => {
    if (!player?.post || player?.post.isFollower) return [];

    return [player.post];
  });

  // draw scenario
  if (actualPlayers.every((player) => player.stocksRemaining === 0)) return [];

  // winner determination fallback through lastFrame

  const determineFromLastFrame =
    (!gameEnd.gameEndMethod || gameEnd.gameEndMethod === GameEndMethod.TIME) &&
    actualPlayers.length >= 2;

  if (determineFromLastFrame) {
    if (settings.isTeams) {
      return getTeamsWinnersFallback(settings.players, actualPlayers);
    }
    return getFfaWinnersFallback(actualPlayers);
  }
  // winner determination through gameEnd
  if (gameEnd.placements && gameEnd.placements.length > 0) {
    const firstPlace = gameEnd.placements.find(
      (player) => player.position === 0,
    );
    if (!firstPlace || firstPlace === undefined) return [];

    if (settings.isTeams) {
      const winnerTeamId = settings.players.find(
        (player) => player.playerIndex === firstPlace.playerIndex,
      )?.teamId;
      if (winnerTeamId !== undefined) {
        return gameEnd.placements
          .filter((player) => {
            const playerTeamId = settings.players.find(
              (p) => p.playerIndex === player.playerIndex,
            )?.teamId;
            return playerTeamId === winnerTeamId;
          })
          .map((p) => p.playerIndex);
      }
    }

    return [firstPlace.playerIndex];
  }

  // no determinable winner
  return [];
}

function aggregateTeams(
  gamePlayers: GameStartType["players"],
  actualPlayers: PostFrameUpdateType[],
) {
  const teamAggregates = new Map<number, TeamAggregate>();

  for (const actualPlayer of actualPlayers) {
    const player = gamePlayers.find(
      (p) => p.playerIndex === actualPlayer.playerIndex,
    );

    const teamId = player?.teamId ?? -1;
    const existing = teamAggregates.get(teamId) ?? {
      totalStocks: 0,
      totalPercent: 0,
      players: [],
    };

    teamAggregates.set(teamId, {
      totalStocks: existing.totalStocks + (actualPlayer.stocksRemaining ?? 0),
      totalPercent: existing.totalPercent + (actualPlayer.percent ?? 0),
      players: [...existing.players, actualPlayer],
    });
  }

  return teamAggregates;
}

// function sortByPerformance(players: PostFrameUpdateType[]) {
//   return [...players].sort((a, b) => {
//     const stockDiff = (b.stocksRemaining ?? 0) - (a.stocksRemaining ?? 0);
//     if (stockDiff !== 0) return stockDiff;

//     return (a.percent ?? 0) - (b.percent ?? 0);
//   });
// }

function getTeamsWinnersFallback(
  gamePlayers: GameStartType["players"],
  actualPlayers: PostFrameUpdateType[],
): number[] {
  const teamAggregates = aggregateTeams(gamePlayers, actualPlayers);

  if (teamAggregates.size === 0) return [];

  const sortedTeams = [...teamAggregates.values()].sort((a, b) => {
    const stockDiff = b.totalStocks - a.totalStocks;
    if (stockDiff !== 0) return stockDiff;
    return a.totalPercent - b.totalPercent;
  });

  if (sortedTeams.length <= 0) return [];

  return sortedTeams[0].players.flatMap((player) =>
    player.playerIndex !== undefined ? [player.playerIndex] : [],
  );
}

// function sortByPerformance(players: PostFrameUpdateType[]) {
//   return [...players].sort((a, b) => {
//     const stockDiff = (b.stocksRemaining ?? 0) - (a.stocksRemaining ?? 0);
//     if (stockDiff !== 0) return stockDiff;

//     return (a.percent ?? 0) - (b.percent ?? 0);
//   });
// }

function getFfaWinnersFallback(players: PostFrameUpdateType[]): number[] {
  const sortedByPerformance = [
    ...players.sort((a, b) => {
      const stockDiff = (b.stocksRemaining ?? 0) - (a.stocksRemaining ?? 0);
      if (stockDiff !== 0) return stockDiff;

      return (a.percent ?? 0) - (b.percent ?? 0);
    }),
  ];

  if (sortedByPerformance.length <= 0) return [];

  const topStocks = sortedByPerformance[0].stocksRemaining;
  const topPercent = sortedByPerformance[0].percent;

  const winners = sortedByPerformance.filter(
    (p) => p.stocksRemaining === topStocks && p.percent === topPercent,
  );

  return winners.flatMap((winner) =>
    winner.playerIndex !== undefined ? [winner.playerIndex] : [],
  );
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

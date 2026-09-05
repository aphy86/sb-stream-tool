import {
  meleeCharacters,
  SlippiGameData,
  SlippiGameEndData,
  SlippiPlayer,
  MeleeCharacter,
  meleeAltCostumes,
} from "@app/common";
import {
  FrameEntryType,
  GameEndMethod,
  GameEndType,
  GameStartType,
  MetadataType,
  PostFrameUpdateType,
  StatsType,
  characters as characterUtils,
} from "@slippi/slippi-js/node";
import { TeamAggregate } from "../../types.js";

export function isSameGame(
  gameData: SlippiGameData,
  previousPlayers: SlippiGameData | null,
) {
  if (
    previousPlayers === null || // first game ever recorded
    previousPlayers.isTeams !== gameData.isTeams ||
    previousPlayers.players.length !== gameData.players.length
  )
    return false;
  for (let i = 0; i < gameData.players.length; i++) {
    if (gameData.players[i].length !== previousPlayers.players[i].length)
      return false;
    for (let j = 0; j < gameData.players[i].length; j++) {
      if (
        gameData.players[i][j].character !==
          previousPlayers.players[i][j].character ||
        gameData.players[i][j].color !== previousPlayers.players[i][j].color ||
        gameData.players[i][j].playerId !==
          previousPlayers.players[i][j].playerId ||
        gameData.players[i][j].port !== previousPlayers.players[i][j].port ||
        gameData.players[i][j].teamId !== previousPlayers.players[i][j].teamId
      )
        return false;
    }
  }
  return true;
}

/**
 * inspired by slippi-js's getWinners function: https://github.com/project-slippi/slippi-js/blob/master/src/common/utils/getWinners.ts
 *
 * returns all winners' playerIndexes in an array
 */
export function getWinner(
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
      if (winnerTeamId) {
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
    player.playerIndex ? [player.playerIndex] : [],
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
    winner.playerIndex ? [winner.playerIndex] : [],
  );
}
export function getStartGameData(
  settings: GameStartType,
): SlippiGameData | undefined {
  const playerData = [] as SlippiPlayer[][];
  let isTeams = settings.isTeams;
  if (!isTeams) {
    for (const player of settings.players) {
      playerData.push([
        {
          character: characterUtils.getCharacterName(
            player.characterId as number,
          ),
          color: characterUtils.getCharacterColorName(
            player.characterId as number,
            player.characterColor as number,
          ),
          playerId: player.playerIndex,
          port: player.port,
          teamId: player.teamId as number,
        },
      ]);
    }
  } else {
    const teamIdsToArrayIndex = new Map<number, number>(); // map each team id to the array index for easy lookups
    for (const player of settings.players) {
      if (player.teamId !== undefined) {
        if (teamIdsToArrayIndex.get(player.teamId) === undefined) {
          teamIdsToArrayIndex.set(player.teamId, playerData.length);
          playerData.push([
            {
              character: characterUtils.getCharacterName(
                player.characterId as number,
              ),
              color: characterUtils.getCharacterColorName(
                player.characterId as number,
                player.characterColor as number,
              ),
              playerId: player.playerIndex,
              port: player.port,
              teamId: player.teamId,
              teamShade: player.teamShade,
            },
          ]);
        } else {
          let index = teamIdsToArrayIndex.get(player.teamId);
          if (
            index !== undefined &&
            index < playerData.length &&
            playerData[index].length <= 2 // <=2 because you can have 1 player on one team and 3 players on another, can't handle that right now in frontend, will do in a future update
          ) {
            playerData[index].push({
              character: characterUtils.getCharacterName(
                player.characterId as number,
              ),
              color: characterUtils.getCharacterColorName(
                player.characterId as number,
                player.characterColor as number,
              ),
              playerId: player.playerIndex,
              port: player.port,
              teamId: player.teamId,
              teamShade: player.teamShade,
            });
          }
        }
      }
    }
  }

  for (let i = 0; i < playerData.length; i++) {
    for (let j = 0; j < playerData[i].length; j++) {
      const player = playerData[i][j];
      if (
        !(meleeCharacters as string[]).includes(player.character) ||
        !meleeAltCostumes[player.character as MeleeCharacter].colors.includes(
          player.color,
        )
      ) {
        return undefined;
      }
    }
  }

  return { isTeams: isTeams ?? false, players: playerData };
}

export function isActualGame(
  gameEnd: GameEndType | null | undefined,
  lastFrame: FrameEntryType | null | undefined,
  playerDamages: Map<number, number>,
) {
  if (!lastFrame || !gameEnd) return false;
  if (lastFrame.frame > 6000) return true;

  let totalDamage = 0;
  const lras = gameEnd.gameEndMethod === 7;

  for (const [_, damage] of playerDamages) {
    totalDamage += damage;
  }

  return (lras && totalDamage > 100) || (!lras && totalDamage > 100);
}

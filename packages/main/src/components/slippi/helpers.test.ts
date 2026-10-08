import { describe, expect, it } from "vitest";
import type { SlippiGameData } from "@app/common";
import { getStartGameData, getWinner, isActualGame, isSameGame } from "./helpers";

/**
 * These helpers decide who won a Slippi game, which drives automatic score updates
 * on stream. Inputs are built as minimal fakes of slippi-js's types.
 */

// slippi-js GameEndMethod values
const TIME = 1;
const GAME = 2;
const NO_CONTEST = 7; // LRAS (L+R+A+Start) quit-out

type FakePost = { playerIndex: number; stocksRemaining: number; percent: number; isFollower?: boolean };

function frame(posts: FakePost[], frameNum = 9000) {
  const players: Record<number, { post: FakePost }> = {};
  for (const post of posts) players[post.playerIndex] = { post: { isFollower: false, ...post } };
  return { frame: frameNum, players } as never;
}

function singlesSettings() {
  return { isTeams: false, players: [{ playerIndex: 0 }, { playerIndex: 1 }] } as never;
}

/** Red team (teamId 0) = players 0 and 1, blue team (teamId 1) = players 2 and 3. */
function teamsSettings() {
  return {
    isTeams: true,
    players: [
      { playerIndex: 0, teamId: 0 },
      { playerIndex: 1, teamId: 0 },
      { playerIndex: 2, teamId: 1 },
      { playerIndex: 3, teamId: 1 },
    ],
  } as never;
}

function gameEnd(method: number, firstPlaceIndex?: number, playerCount = 2) {
  const placements =
    firstPlaceIndex === undefined
      ? []
      : Array.from({ length: playerCount }, (_, i) => ({
          playerIndex: i,
          position: i === firstPlaceIndex ? 0 : 1,
        }));
  return { gameEndMethod: method, lrasInitiatorIndex: undefined, placements } as never;
}

describe("getWinner", () => {
  it("returns no winner when game data is missing", () => {
    expect(getWinner(null, null, null)).toEqual([]);
    expect(getWinner(singlesSettings(), undefined, gameEnd(GAME, 0))).toEqual([]);
  });

  it("returns no winner for a draw (everyone at 0 stocks)", () => {
    const last = frame([
      { playerIndex: 0, stocksRemaining: 0, percent: 50 },
      { playerIndex: 1, stocksRemaining: 0, percent: 70 },
    ]);
    expect(getWinner(singlesSettings(), last, gameEnd(GAME, 0))).toEqual([]);
  });

  it.each([0, 1])("singles, game ends normally: player %i wins from placements", (winner) => {
    const last = frame([
      { playerIndex: 0, stocksRemaining: winner === 0 ? 2 : 0, percent: 30 },
      { playerIndex: 1, stocksRemaining: winner === 1 ? 2 : 0, percent: 30 },
    ]);
    expect(getWinner(singlesSettings(), last, gameEnd(GAME, winner))).toEqual([winner]);
  });

  it("singles, timeout: player with more stocks wins", () => {
    const last = frame([
      { playerIndex: 0, stocksRemaining: 1, percent: 10 },
      { playerIndex: 1, stocksRemaining: 3, percent: 90 },
    ]);
    expect(getWinner(singlesSettings(), last, gameEnd(TIME))).toEqual([1]);
  });

  it("singles, timeout with equal stocks: lower percent wins", () => {
    const last = frame([
      { playerIndex: 0, stocksRemaining: 2, percent: 120 },
      { playerIndex: 1, stocksRemaining: 2, percent: 40 },
    ]);
    expect(getWinner(singlesSettings(), last, gameEnd(TIME))).toEqual([1]);
  });

  it("ignores followers like Nana when deciding the winner", () => {
    const last = frame([
      { playerIndex: 0, stocksRemaining: 0, percent: 0 },
      { playerIndex: 1, stocksRemaining: 1, percent: 0 },
      { playerIndex: 2, stocksRemaining: 4, percent: 0, isFollower: true },
    ]);
    expect(getWinner(singlesSettings(), last, gameEnd(GAME, 1))).toEqual([1]);
  });

  it("teams: both members of the winning (blue) team are returned", () => {
    const last = frame([
      { playerIndex: 0, stocksRemaining: 0, percent: 0 },
      { playerIndex: 1, stocksRemaining: 0, percent: 0 },
      { playerIndex: 2, stocksRemaining: 1, percent: 0 },
      { playerIndex: 3, stocksRemaining: 1, percent: 0 },
    ]);
    expect(getWinner(teamsSettings(), last, gameEnd(GAME, 2, 4))).toEqual([2, 3]);
  });

  /**
   * KNOWN BUGS. `it.fails` passes while the bug exists and turns red once it's fixed,
   * which is the signal to flip it to a normal `it`.
   * Root cause for both: index/team id 0 is falsy, so `x ? ... : []` drops it.
   */
  describe("known bugs (falsy zero)", () => {
    it.fails("BUG: singles timeout won by port 1 (playerIndex 0) reports no winner", () => {
      const last = frame([
        { playerIndex: 0, stocksRemaining: 3, percent: 10 },
        { playerIndex: 1, stocksRemaining: 1, percent: 80 },
      ]);
      expect(getWinner(singlesSettings(), last, gameEnd(TIME))).toEqual([0]);
    });

    it("teams timeout: blue team with more stocks wins (both players)", () => {
      const last = frame([
        { playerIndex: 0, stocksRemaining: 1, percent: 0 },
        { playerIndex: 1, stocksRemaining: 0, percent: 0 },
        { playerIndex: 2, stocksRemaining: 2, percent: 0 },
        { playerIndex: 3, stocksRemaining: 1, percent: 0 },
      ]);
      expect(getWinner(teamsSettings(), last, gameEnd(TIME))).toEqual([2, 3]);
    });

    it.fails("BUG: teams timeout won by red team drops player 0 (returns only [1])", () => {
      const last = frame([
        { playerIndex: 0, stocksRemaining: 2, percent: 0 },
        { playerIndex: 1, stocksRemaining: 1, percent: 0 },
        { playerIndex: 2, stocksRemaining: 1, percent: 0 },
        { playerIndex: 3, stocksRemaining: 0, percent: 0 },
      ]);
      expect(getWinner(teamsSettings(), last, gameEnd(TIME))).toEqual([0, 1]);
    });

    it.fails("BUG: teams win by red team (teamId 0) returns only one player", () => {
      const last = frame([
        { playerIndex: 0, stocksRemaining: 1, percent: 0 },
        { playerIndex: 1, stocksRemaining: 1, percent: 0 },
        { playerIndex: 2, stocksRemaining: 0, percent: 0 },
        { playerIndex: 3, stocksRemaining: 0, percent: 0 },
      ]);
      expect(getWinner(teamsSettings(), last, gameEnd(GAME, 0, 4))).toEqual([0, 1]);
    });
  });
});

describe("isActualGame (filters out handwarmers and quick quit-outs)", () => {
  const end = gameEnd(GAME);
  const damages = (...d: number[]) => new Map(d.map((dmg, i) => [i, dmg]));

  it("is false with no data", () => {
    expect(isActualGame(null, null, new Map())).toBe(false);
  });

  it("is true for any game longer than 6000 frames (~100s)", () => {
    expect(isActualGame(end, frame([], 6001), damages(0, 0))).toBe(true);
  });

  it("is false for a short game with little damage", () => {
    expect(isActualGame(end, frame([], 1000), damages(30, 20))).toBe(false);
  });

  it("is true for a short game with over 100 total damage", () => {
    expect(isActualGame(end, frame([], 1000), damages(60, 41))).toBe(true);
  });

  it("uses the same 100-damage rule for LRAS quit-outs", () => {
    expect(isActualGame(gameEnd(NO_CONTEST), frame([], 1000), damages(50, 50))).toBe(false);
    expect(isActualGame(gameEnd(NO_CONTEST), frame([], 1000), damages(51, 50))).toBe(true);
  });
});

describe("isSameGame (detects a rematch with the same setup)", () => {
  const game = (character = "Fox"): SlippiGameData => ({
    isTeams: false,
    players: [
      [{ character, color: "Default", playerId: 0, port: 1, teamId: 0 }],
      [{ character: "Falco", color: "Default", playerId: 1, port: 2, teamId: 0 }],
    ],
  });

  it("is false for the first game ever (no previous game)", () => {
    expect(isSameGame(game(), null)).toBe(false);
  });

  it("is true when characters, colors, and ports all match", () => {
    expect(isSameGame(game(), game())).toBe(true);
  });

  it("is false when a player switches characters", () => {
    expect(isSameGame(game("Marth"), game())).toBe(false);
  });

  it("is false when the number of players changes", () => {
    const bigger = game();
    bigger.players.push([{ character: "Sheik", color: "Default", playerId: 2, port: 3, teamId: 0 }]);
    expect(isSameGame(bigger, game())).toBe(false);
  });
});

describe("getStartGameData", () => {
  it("maps slippi character ids to names and puts each singles player on their own side", () => {
    const data = getStartGameData({
      isTeams: false,
      players: [
        { playerIndex: 0, port: 1, characterId: 2, characterColor: 0, teamId: 0 },
        { playerIndex: 1, port: 2, characterId: 20, characterColor: 0, teamId: 0 },
      ],
    } as never);

    expect(data?.isTeams).toBe(false);
    expect(data?.players.map((side) => side.map((p) => p.character))).toEqual([["Fox"], ["Falco"]]);
  });

  it("groups doubles players by team id", () => {
    const data = getStartGameData({
      isTeams: true,
      players: [
        { playerIndex: 0, port: 1, characterId: 2, characterColor: 0, teamId: 0 },
        { playerIndex: 1, port: 2, characterId: 20, characterColor: 0, teamId: 1 },
        { playerIndex: 2, port: 3, characterId: 9, characterColor: 0, teamId: 0 },
        { playerIndex: 3, port: 4, characterId: 19, characterColor: 0, teamId: 1 },
      ],
    } as never);

    expect(data?.players.map((side) => side.map((p) => p.port))).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });
});

import { describe, expect, it } from "vitest";
import type { Team } from "@app/common";
import { findSlippiWinner } from "./helpers";

/**
 * Slippi reports winners as 0-based player indexes; the overlay stores 1-based ports.
 * This mapping decides which team's score goes up after a game.
 */
describe("findSlippiWinner (slippi winner -> overlay team index)", () => {
  const team = (...ports: number[]): Team =>
    ({
      name: "",
      score: 0,
      inLosers: false,
      players: ports.map((port) => ({ playerInfo: {}, gameInfo: { port } })),
    }) as unknown as Team;

  it("maps player index 0 to the team using port 1", () => {
    expect(findSlippiWinner([0], [team(1), team(2)])).toBe(0);
  });

  it("maps player index 1 to the team using port 2", () => {
    expect(findSlippiWinner([1], [team(1), team(2)])).toBe(1);
  });

  it("finds the right team in doubles", () => {
    expect(findSlippiWinner([3], [team(1, 3), team(2, 4)])).toBe(1);
  });

  it("works when players aren't on ports 1 and 2", () => {
    expect(findSlippiWinner([3], [team(2), team(4)])).toBe(1);
  });

  it("returns undefined with no winner (e.g. a draw)", () => {
    expect(findSlippiWinner([], [team(1), team(2)])).toBeUndefined();
  });

  it("returns undefined when no team has the winner's port", () => {
    expect(findSlippiWinner([3], [team(1), team(2)])).toBeUndefined();
  });
});

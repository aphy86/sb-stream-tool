/**
 * Helper functions used by hooks only
 */

import { Team } from "@app/common";

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

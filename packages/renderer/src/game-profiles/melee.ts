import { meleeCharacters, MeleePortColor, MeleeTeamColor } from "@app/common";
import { GameProfile } from "@renderer/types/GameProfile";

export const MeleeProfile: GameProfile<MeleeTeamColor, MeleePortColor> = {
  id: "melee",
  name: "Smash Bros. Melee",

  teamColors: ["Blue", "Green", "Red"],
  portColors: ["Blue", "Green", "Red", "Yellow"],

  portNumbers: [1, 2, 3, 4],

  characters: meleeCharacters,

  charactersRenderLocation: "characters/melee",

  portColorType: "static",

  portColorMap: new Map([
    [1, "Red"],
    [2, "Blue"],
    [3, "Green"],
    [4, "Yellow"],
  ]),
};

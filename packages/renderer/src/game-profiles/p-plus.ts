import { pPlusCharacters, PPlusPortColor, PPlusTeamColor } from "@app/common";
import { GameProfile } from "@renderer/types/GameProfile";

export const PPlusProfile: GameProfile<PPlusTeamColor, PPlusPortColor> = {
  id: "p+",
  name: "Smash Bros. Project Plus",

  portNumbers: [1, 2, 3, 4],
  teamColors: ["Red", "Blue", "Green"],
  portColors: [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
    "Pink",
    "Orange",
    "Brown",
    "Black",
    "White",
    "Cyan",
    "Gray",
  ],

  characters: pPlusCharacters,

  charactersRenderLocation: "characters/melee",

  portColorType: "dynamic",
};

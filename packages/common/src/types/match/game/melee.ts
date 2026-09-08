export type MeleePortColor = "Red" | "Blue" | "Green" | "Yellow";

export type MeleeTeamColor = "Red" | "Blue" | "Green";

export type PortColor = "Red" | "Blue" | "Green" | "Yellow";

export type MeleeCharacter =
  | "Bowser"
  | "Captain Falcon"
  | "Donkey Kong"
  | "Dr. Mario"
  | "Falco"
  | "Fox"
  | "Ganondorf"
  | "Ice Climbers"
  | "Jigglypuff"
  | "Kirby"
  | "Link"
  | "Luigi"
  | "Mario"
  | "Marth"
  | "Mewtwo"
  | "Mr. Game & Watch"
  | "Ness"
  | "Peach"
  | "Pichu"
  | "Pikachu"
  | "Roy"
  | "Samus"
  | "Sheik"
  | "Yoshi"
  | "Young Link"
  | "Zelda"
  | "Random";

export type AltCostumeEntry = {
  characterName: MeleeCharacter;
  numberOfCostumes: number;
  colors: string[];
};

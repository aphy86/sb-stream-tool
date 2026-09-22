import { AltCostumeEntry, MeleeCharacter } from "../types";

export const meleeCharacters: MeleeCharacter[] = [
  "Bowser",
  "Captain Falcon",
  "Donkey Kong",
  "Dr. Mario",
  "Falco",
  "Fox",
  "Ganondorf",
  "Ice Climbers",
  "Jigglypuff",
  "Kirby",
  "Link",
  "Luigi",
  "Mario",
  "Marth",
  "Mewtwo",
  "Mr. Game & Watch",
  "Ness",
  "Peach",
  "Pichu",
  "Pikachu",
  "Roy",
  "Samus",
  "Sheik",
  "Yoshi",
  "Young Link",
  "Zelda",
  "Random",
];

export const meleeAltCostumes: Record<MeleeCharacter, AltCostumeEntry> = {
  Bowser: {
    characterName: "Bowser",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Blue", "Black"],
  },
  "Captain Falcon": {
    characterName: "Captain Falcon",
    numberOfCostumes: 6,
    colors: ["Default", "Black", "Red", "White", "Green", "Blue"],
  },
  "Donkey Kong": {
    characterName: "Donkey Kong",
    numberOfCostumes: 5,
    colors: ["Default", "Black", "Red", "Blue", "Green"],
  },
  "Dr. Mario": {
    characterName: "Dr. Mario",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Green", "Black"],
  },
  Falco: {
    characterName: "Falco",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Blue", "Green"],
  },
  Fox: {
    characterName: "Fox",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Blue", "Green"],
  },
  Ganondorf: {
    characterName: "Ganondorf",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Green", "Purple"],
  },
  "Ice Climbers": {
    characterName: "Ice Climbers",
    numberOfCostumes: 4,
    colors: ["Default", "Green", "Orange", "Red"],
  },
  Jigglypuff: {
    characterName: "Jigglypuff",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Headband", "Crown"],
  },
  Kirby: {
    characterName: "Kirby",
    numberOfCostumes: 6,
    colors: ["Default", "Yellow", "Blue", "Red", "Green", "White"],
  },
  Link: {
    characterName: "Link",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Black", "White"],
  },
  Luigi: {
    characterName: "Luigi",
    numberOfCostumes: 4,
    colors: ["Default", "White", "Blue", "Red"],
  },
  Mario: {
    characterName: "Mario",
    numberOfCostumes: 5,
    colors: ["Default", "Yellow", "Black", "Blue", "Green"],
  },
  Marth: {
    characterName: "Marth",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Green", "Black", "White"],
  },
  Mewtwo: {
    characterName: "Mewtwo",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Blue", "Green"],
  },
  "Mr. Game & Watch": {
    characterName: "Mr. Game & Watch",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Blue", "Green"],
  },
  Ness: {
    characterName: "Ness",
    numberOfCostumes: 4,
    colors: ["Default", "Yellow", "Blue", "Green"],
  },
  Peach: {
    characterName: "Peach",
    numberOfCostumes: 4,
    colors: ["Default", "Daisy", "White", "Blue", "Green"],
  },
  Pichu: {
    characterName: "Pichu",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Blue", "Green"],
  },
  Pikachu: {
    characterName: "Pikachu",
    numberOfCostumes: 4,
    colors: ["Default", "Red", "Party Hat", "Cowboy Hat"],
  },
  Roy: {
    characterName: "Roy",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Green", "Yellow"],
  },
  Samus: {
    characterName: "Samus",
    numberOfCostumes: 5,
    colors: ["Default", "Pink", "Black", "Green", "Purple"],
  },
  Sheik: {
    characterName: "Sheik",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Green", "White"],
  },
  Yoshi: {
    characterName: "Yoshi",
    numberOfCostumes: 6,
    colors: ["Default", "Red", "Blue", "Yellow", "Pink", "Cyan"],
  },
  "Young Link": {
    characterName: "Young Link",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "White", "Black"],
  },
  Zelda: {
    characterName: "Zelda",
    numberOfCostumes: 5,
    colors: ["Default", "Red", "Blue", "Green", "White"],
  },
  Random: {
    characterName: "Random",
    numberOfCostumes: 0,
    colors: ["Default"],
  },
};

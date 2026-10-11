export const ALL_GAME_PROFILE_IDS = ["melee", "p+"] as const;

export type GameProfileId = (typeof ALL_GAME_PROFILE_IDS)[number];

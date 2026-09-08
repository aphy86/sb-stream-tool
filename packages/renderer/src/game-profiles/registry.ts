import { GameProfile } from "@renderer/types/GameProfile";
import { MeleeProfile } from "./melee";
import { GameProfileId } from "@app/common";

export const PROFILES: GameProfile[] = [MeleeProfile];

export function getProfileById(id: GameProfileId) {
  const platform = PROFILES.find((profile) => profile.id === id);
  if (!platform) {
    throw new Error(`No game profile found for id "${id}"`);
  }
  return platform;
}

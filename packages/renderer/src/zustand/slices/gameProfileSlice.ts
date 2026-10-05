import { StoreSliceType } from "./slice";
import { StateCreator } from "zustand";
import { GameProfile } from "@renderer/types/GameProfile";
import { MeleeProfile } from "@renderer/game-profiles/melee";

export type GameProfileSlice = {
  gameProfile: GameProfile;
  updateGameProfile: (newProfile: GameProfile) => void;
};

export const createGameProfileSlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  GameProfileSlice
> = (set) => ({
  gameProfile: MeleeProfile,
  updateGameProfile: (newProfile) =>
    set((state) => {
      state.gameProfile = newProfile;
    }),
});

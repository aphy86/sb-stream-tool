import { type StateCreator } from "zustand";
import { type StoreSliceType } from "./slice";
import { send } from "@app/preload";
import { ALL_OBS_SCENE_TYPES, fromKeys, ObsSceneSettings } from "@app/common";

export type ObsScene = {
  scene: string;
  start: number;
};

export type ObsScenesSlice = {
  scenes: ObsSceneSettings;
  updateScenes: (scenes: ObsSceneSettings) => Promise<void>;
};

export const createObsScenesSlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  ObsScenesSlice
> = (set) => ({
  scenes: fromKeys(ALL_OBS_SCENE_TYPES, (): ObsScene[] => []),
  updateScenes: async (scenes) => {
    const saved: ObsSceneSettings = await send("obs/save-scenes", scenes);
    set((state) => {
      state.scenes = saved;
    });
  },
});

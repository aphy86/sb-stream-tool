import { type StateCreator } from "zustand";
import { type StoreSliceType } from "./slice";
import { send } from "@app/preload";
import type { PlatformId } from "@renderer/types/platform";

export type PlatformSlice = {
  credentials: Partial<Record<PlatformId, string>>;
  updateCredential: (platform: PlatformId, newApiKey: string) => void;
};

// https://github.com/pmndrs/zustand/discussions/676
export const createPlatformSlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  PlatformSlice
> = (set) => ({
  credentials: {},
  updateCredential: (platform, newApiKey) => {
    set((state) => {
      state.credentials[platform] = newApiKey;
    });
    send("platform/save-credential", platform, newApiKey).catch((error) =>
      console.log(error),
    );
  },
});

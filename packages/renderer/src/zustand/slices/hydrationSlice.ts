// slices/hydrationSlice.ts
import type { StateCreator } from "zustand";
import type { StoreSliceType } from "./slice";

export type HydrationSlice = {
  isSettingsHydrated: boolean;
};

export const createHydrationSlice: StateCreator<
  StoreSliceType,
  [["zustand/subscribeWithSelector", never], ["zustand/immer", never]],
  [],
  HydrationSlice
> = () => ({
  isSettingsHydrated: false,
});

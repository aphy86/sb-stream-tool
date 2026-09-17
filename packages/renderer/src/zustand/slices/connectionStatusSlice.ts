import { StateCreator } from "zustand";
import { StoreSliceType } from "./slice";

export type ConnectionStatusSlice = {
  connectionStatuses: Map<string, string>;
  updateConnectionStatus: (type: string, status: string) => void;
};

const defaultConnectionStatuses = new Map<string, string>([
  ["obs", "disconnected"],
  ["slippi-wii", "disconnected"],
  ["slippi-dolphin", "disconnected"],
  ["slippi-folder", "disconnected"],
]);

export const createConnectionStatusSlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  ConnectionStatusSlice
> = (set) => ({
  connectionStatuses: defaultConnectionStatuses,
  updateConnectionStatus: (type, newStatus) => {
    set((state) => {
      if (state.connectionStatuses.get(type)) {
        state.connectionStatuses.set(type, newStatus);
      }
    });
  },
});

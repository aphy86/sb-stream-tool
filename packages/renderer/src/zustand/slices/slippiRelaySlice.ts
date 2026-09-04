import { type StateCreator } from "zustand";
import { type StoreSliceType } from "./slice";
import type {
  SlippiPlayer,
  SlippiRelayStatus,
  SlippiRelaySettings,
} from "@app/common";
import { send } from "@app/preload";

export type SlippiRelaySlice = {
  slippiRelayStatus: SlippiRelayStatus;
  slippiRelayDirectory: string;
  slippiWiiRelayIp: string;
  slippiWiiRelayPort: number;
  slippiDolphinRelayIp: string;
  slippiDolphinRelayPort: number;
  players: SlippiPlayer[][];
  slippiRelayAutoupload: boolean;
  setPlayers: (newData: SlippiPlayer[][]) => void;
  swapCharacters: (firstIndex: number, secondIndex: number) => void;
  updateSlippiRelayStatus: (newRelayStatus: SlippiRelayStatus) => void;
  updateSlippiRelayDirectory: (newDirectory: string) => void;
  updateSlippiWiiRelayConnection: (newIp: string, newPort: number) => void;
  updateSlippiDolphinRelayConnection: (newIp: string, newPort: number) => void;
  writeSlippiRelaySettingsToFile: (
    settings: Partial<SlippiRelaySettings>,
  ) => void;
};

// https://github.com/pmndrs/zustand/discussions/676
export const createSlippiRelaySlice: StateCreator<
  StoreSliceType,
  [["zustand/immer", never]],
  [],
  SlippiRelaySlice
> = (set, get) => ({
  slippiRelayStatus: "disabled",
  slippiRelayDirectory: "",
  slippiWiiRelayIp: "",
  slippiWiiRelayPort: 0,
  slippiDolphinRelayIp: "",
  slippiDolphinRelayPort: 0,
  // consoleConnection: false,
  players: [] as SlippiPlayer[][],
  slippiRelayAutoupload: false,
  setPlayers: (newData) =>
    set((state) => {
      state.players = newData;
    }),
  swapCharacters: (firstIndex, secondIndex) =>
    set((state) => {
      if (
        firstIndex >= state.players.length ||
        firstIndex < 0 ||
        secondIndex >= state.players.length ||
        secondIndex < 0
      ) {
        return;
      }
      const first = state.players[firstIndex];
      state.players[firstIndex] = state.players[secondIndex];
      state.players[secondIndex] = first;
    }),
  updateSlippiRelayDirectory: (newDirectory: string) => {
    set((state) => {
      state.slippiRelayDirectory = newDirectory;
    });
  },
  updateSlippiWiiRelayConnection: (newIp, newPort) => {
    set((state) => {
      state.slippiWiiRelayIp = newIp;
      state.slippiWiiRelayPort = newPort;
    });
  },
  updateSlippiDolphinRelayConnection: (newIp, newPort) => {
    set((state) => {
      state.slippiDolphinRelayIp = newIp;
      state.slippiDolphinRelayPort = newPort;
    });
  },
  updateSlippiRelayStatus: (newRelayStatus: SlippiRelayStatus) => {
    set((state) => {
      state.slippiRelayStatus = newRelayStatus;
    });
  },
  writeSlippiRelaySettingsToFile: (settings: Partial<SlippiRelaySettings>) => {
    send("slippi-relay/save-settings", {
      relayStatus: get().slippiRelayStatus,
      ...settings,
    } as Partial<SlippiRelaySettings>);
  },
  updateSlippiRelayAutoupload: (enabled: boolean) =>
    set((state) => {
      state.slippiRelayAutoupload = enabled;
    }),
});

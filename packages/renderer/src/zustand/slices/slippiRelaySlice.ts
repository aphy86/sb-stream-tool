import { type StateCreator } from "zustand";
import { type StoreSliceType } from "./slice";
import type { SlippiRelayStatus, SlippiRelaySettings } from "@app/common";
import { send } from "@app/preload";

export type SlippiRelaySlice = {
  slippiRelayStatus: SlippiRelayStatus;
  slippiRelayDirectory: string;
  slippiWiiRelayIp: string;
  slippiWiiRelayPort: number;
  slippiDolphinRelayIp: string;
  slippiDolphinRelayPort: number;
  slippiRelayAutoupdate: boolean;
  updateSlippiRelayStatus: (newRelayStatus: SlippiRelayStatus) => void;
  updateSlippiRelayDirectory: (newDirectory: string) => void;
  updateSlippiWiiRelayConnection: (newIp: string, newPort: number) => void;
  updateSlippiDolphinRelayConnection: (newIp: string, newPort: number) => void;
  updateSlippiRelayAutoupdate: (autoUpdate: boolean) => void;
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
> = (set) => ({
  slippiRelayStatus: "disabled",
  slippiRelayDirectory: "",
  slippiWiiRelayIp: "",
  slippiWiiRelayPort: 0,
  slippiDolphinRelayIp: "",
  slippiDolphinRelayPort: 0,
  slippiRelayAutoupdate: true,
  updateSlippiRelayDirectory: (newDirectory: string) => {
    set((state) => {
      state.slippiRelayDirectory = newDirectory;
    });
  },
  updateSlippiRelayAutoupdate: (autoUpdate) => {
    set((state) => {
      state.slippiRelayAutoupdate = autoUpdate;
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
      ...settings,
    } as Partial<SlippiRelaySettings>);
  },
});

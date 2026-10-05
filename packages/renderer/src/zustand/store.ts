import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { createObsScenesSlice } from "./slices/obsScenesSlice";
import { createPlatformSlice } from "./slices/platformSlice";
import { type StoreSliceType } from "./slices/slice";
import { createSlippiRelaySlice } from "./slices/slippiRelaySlice";
import { createObsWebsocketSlice } from "./slices/obsWebsocketSlice";
import { createEventSlice } from "./slices/eventSlice";
import { createShortcutsSlice } from "./slices/shortcutsSlice";
import { enableMapSet } from "immer";
import { createGameProfileSlice } from "./slices/gameProfileSlice";
import { createHydrationSlice } from "./slices/hydrationSlice";
import { setup } from "./setup";

enableMapSet();

export const useSettingsStore = create<StoreSliceType>()(
  subscribeWithSelector(
    immer((...a) => ({
      ...createObsScenesSlice(...a),
      ...createPlatformSlice(...a),
      ...createSlippiRelaySlice(...a),
      ...createObsWebsocketSlice(...a),
      ...createEventSlice(...a),
      ...createShortcutsSlice(...a),
      ...createGameProfileSlice(...a),
      ...createHydrationSlice(...a),
    })),
  ),
);

setup();

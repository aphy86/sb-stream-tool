import { type EventSlice } from "./eventSlice";
import { type ShortcutsSlice } from "./shortcutsSlice";
import { type ObsScenesSlice } from "./obsScenesSlice";
import { type ObsWebsocketSlice } from "./obsWebsocketSlice";
import { type SlippiRelaySlice } from "./slippiRelaySlice";
import { type PlatformSlice } from "./platformSlice";
import { type GameProfileSlice } from "./gameProfileSlice";
import { type HydrationSlice } from "./hydrationSlice";

export type StoreSliceType = ObsScenesSlice &
  PlatformSlice &
  SlippiRelaySlice &
  ObsWebsocketSlice &
  EventSlice &
  GameProfileSlice &
  ShortcutsSlice &
  HydrationSlice;

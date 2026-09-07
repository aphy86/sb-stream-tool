/* eslint-disable no-useless-escape */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { createObsScenesSlice } from "./slices/obsScenesSlice";
import { createPlatformSlice } from "./slices/platformSlice";
import { type StoreSliceType } from "./slices/slice";
import { createSlippiRelaySlice } from "./slices/slippiRelaySlice";
import { createObsWebsocketSlice } from "./slices/obsWebsocketSlice";
import { send } from "@app/preload";
import { createEventSlice } from "./slices/eventSlice";
import {
  createShortcutsSlice,
  defaultShortcuts,
} from "./slices/shortcutsSlice";
import { enableMapSet } from "immer";
import {
  ObsScene,
  ObsSceneSettings,
  ObsWebsocketSettings,
  ShortcutSettings,
  SlippiRelaySettings,
  // SlippiRelaySettings,
} from "@app/common";
import { Hotkey } from "@tanstack/react-hotkeys";
import { createZustandStateSlice } from "./slices/zustandStateSlice";
import { PLATFORMS, resolveEventUrl } from "@renderer/platform/registry";

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
      ...createZustandStateSlice(...a),
    })),
  ),
);

// restore settings
// https://github.com/pmndrs/zustand/discussions/676
Promise.all([
  ...PLATFORMS.map((platform) =>
    send("platform/get-credential", platform.id)
      .then((key: string) => {
        useSettingsStore.setState((state) => ({
          credentials: { ...state.credentials, [platform.id]: key },
        }));
      })
      .catch((error) => console.log(error)),
  ),
  send("shortcuts/get-shortcuts")
    .then((shortcutsList: ShortcutSettings | undefined) => {
      if (shortcutsList === undefined) return;
      const retrievedShortcuts = new Map(defaultShortcuts);
      shortcutsList.forEach((shortcut) =>
        retrievedShortcuts.set(shortcut.action, shortcut.hotkey as Hotkey),
      );
      useSettingsStore.setState({ shortcuts: retrievedShortcuts });
    })
    .catch((error) => console.log(error)),
  send("obs/get-settings")
    .then(
      (settings: {
        websocket: ObsWebsocketSettings | undefined;
        scenes: ObsSceneSettings | undefined;
      }) => {
        if (settings.websocket !== undefined) {
          useSettingsStore.setState({
            websocketIp: settings.websocket.ip,
            websocketPort: settings.websocket.port,
          });
        }

        if (settings.scenes !== undefined) {
          const gameStartScenes = [] as ObsScene[];
          const gameEndScenes = [] as ObsScene[];
          const setEndScenes = [] as ObsScene[];

          settings.scenes.forEach((scene) => {
            switch (scene.type) {
              case "game-start":
                gameStartScenes.push(scene.scene);
                break;
              case "game-end":
                gameEndScenes.push(scene.scene);
                break;
              case "set-end":
                setEndScenes.push(scene.scene);
                break;
              default:
                throw new Error(
                  `UNKNOWN TYPE, idk how you even got this on a known typed value`,
                );
            }
          });
          useSettingsStore.setState({
            gameStartScenes: gameStartScenes,
            gameEndScenes: gameEndScenes,
            setEndScenes: setEndScenes,
          });
        }
      },
    )
    .catch((error) => console.log(error)),
  send("slippi-relay/get-settings")
    .then((settings: SlippiRelaySettings | undefined) => {
      if (settings === undefined) return;
      useSettingsStore.setState({
        slippiRelayStatus: settings.relayStatus,
        slippiRelayDirectory: settings.directory,
        slippiWiiRelayIp: settings.wiiIp,
        slippiWiiRelayPort: settings.wiiPort,
        slippiDolphinRelayIp: settings.dolphinIp,
        slippiDolphinRelayPort: settings.dolphinPort,
      });
    })
    .catch((error) => console.log(error)),
  send("platform/get-event-url")
    .then((url: string) => {
      const eventId = resolveEventUrl(url);
      if (!eventId) return;
      useSettingsStore.setState({
        eventUrl: eventId.url,
        eventSlug: eventId.id,
      });
    })
    .catch((error) => console.log(error)),
])
  .then(() => useSettingsStore.setState({ isIpcHydrated: true }))
  .catch((error) => {
    useSettingsStore.setState({ isIpcHydrated: false });
    console.log(error);
  });

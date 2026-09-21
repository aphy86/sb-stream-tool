import { Socket } from "socket.io-client";
import { FileHandler } from "./components/FileHandler.js";
import { ObsController } from "./components/ObsController.js";
import { ClientToServerEvents, ServerToClientEvents } from "./types.js";
import {
  GameProfileId,
  ObsScene,
  ObsSceneSettings,
  ObsWebsocketSettings,
  ShortcutSettings,
  SlippiRelayConfig,
  SlippiRelaySettings,
  Match,
} from "@app/common";
import { dialog, shell } from "electron";
import { SettingsStore } from "./components/SettingsStore.js";
import { SlippiRelayHandler } from "./components/slippi/SlippiRelayHandler.js";

export type SharedRegistry = {
  [key: string]: (...args: any[]) => Promise<any> | any;
};

export function createHandlers(
  mainSocket: Socket<ServerToClientEvents, ClientToServerEvents>,
): SharedRegistry {
  return {
    "obs/connect": (ip: string, port: string, password: string) => {
      ObsController.connect("ws://", ip, port, password);
    },

    "obs/disconnect": () => ObsController.disconnect(),

    "obs/update-scenes": (
      gameStartScenes: ObsScene[],
      gameEndScenes: ObsScene[],
      setEndScenes: ObsScene[],
    ) => {
      ObsController.updateScenes(gameStartScenes, gameEndScenes, setEndScenes);
    },

    "overlay/update": (newData: Match) => {
      mainSocket.emit("sendDataToServer", newData);
      FileHandler.writeData(newData);
    },

    "obs/play-game-start-scenes": () => ObsController.playScenes("game-start"),

    "obs/play-game-end-scenes": () => ObsController.playScenes("game-end"),

    "obs/play-set-end-scenes": () => ObsController.playScenes("set-end"),

    "obs/save-websocket-settings": (newSettings: ObsWebsocketSettings) =>
      SettingsStore.writeObsWebsocketSettings(newSettings),

    "obs/get-settings": () => SettingsStore.getObsSettings(),

    "obs/save-scenes": (newScenes: ObsSceneSettings) =>
      SettingsStore.writeObsScenes(newScenes),

    "platform/get-credential": async (platform: string) =>
      SettingsStore.getPlatformApiKey(platform),

    "platform/save-credential": (platform: string, newApiKey: string) =>
      SettingsStore.writePlatformApiKey(platform, newApiKey),

    "platform/save-event-url": (newEventUrl: string) =>
      SettingsStore.writeEventUrl(newEventUrl),

    "platform/get-event-url": () => SettingsStore.getEventUrl(),

    "shortcuts/get-shortcuts": async () => SettingsStore.getShortcuts(),

    "shortcuts/save-shortcuts": (newSettings: ShortcutSettings) =>
      SettingsStore.writeShortcutSettings(newSettings),

    "file:openDialog": async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      if (canceled) {
        return "";
      } else {
        return filePaths[0];
      }
    },

    "link/open": (link: string) => shell.openExternal(link),

    "slippi-relay/start": (config: SlippiRelayConfig) => {
      SlippiRelayHandler.setup(config);
    },

    "slippi-relay/stop": () => {
      SlippiRelayHandler.stopRelay(false);
    },

    "slippi-relay/auto-stop": () => {
      SlippiRelayHandler.stopRelay(true);
    },

    "slippi-relay/save-settings": (
      newSettings: Partial<SlippiRelaySettings>,
    ) => {
      SettingsStore.writeSlippiRelaySettings(newSettings);
    },

    "slippi-relay/get-settings": () => SettingsStore.getSlippiRelaySettings(),

    "game-profile/get": () => SettingsStore.getGameProfile(),

    "game-profile/save": (newProfile: GameProfileId) =>
      SettingsStore.writeGameProfile(newProfile),
  };
}

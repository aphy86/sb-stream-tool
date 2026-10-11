import {
  ALL_ACTIONS,
  ALL_GAME_PROFILE_IDS,
  ALL_OBS_SCENE_TYPES,
  ALL_SLIPPI_RELAY_STATUSES,
  fromKeys,
  GameProfileId,
  ObsScene,
  ObsSceneSettings,
  ObsWebsocketSettings,
  ShortcutSettings,
  SlippiRelaySettings,
} from "@app/common";
import { RocksDatabase } from "@harperfast/rocksdb-js";
import { app } from "electron";
import { Mutex } from "es-toolkit";
import path from "node:path";
import { EventStream } from "./EventStream.js";

const DB_KEYS = {
  slippiRelay: "slippi-relay-settings",
  shortcuts: "shortcuts",
  eventUrl: "event-url",
  obsWebsocket: "obs-websocket-settings",
  obsScenes: "obs-scenes",
  gameProfile: "game-profile",
  apiKey: (platform: string) => `platform:${platform}:api-key`,
};

const DEFAULT_SLIPPI_RELAY_SETTINGS: SlippiRelaySettings = {
  relayStatus: "disabled",
  directory: "",
  wiiIp: "",
  wiiPort: 0,
  dolphinIp: "",
  dolphinPort: 0,
};

function isObject(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

function isSlippiRelaySettings(data: unknown): data is SlippiRelaySettings {
  return (
    isObject(data) &&
    ALL_SLIPPI_RELAY_STATUSES.includes(data.relayStatus as never) &&
    typeof data.directory === "string" &&
    typeof data.wiiIp === "string" &&
    typeof data.wiiPort === "number" &&
    typeof data.dolphinIp === "string" &&
    typeof data.dolphinPort === "number"
  );
}

function isShortcutSettings(data: unknown): data is ShortcutSettings {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        isObject(item) &&
        typeof item.hotkey === "string" &&
        ALL_ACTIONS.includes(item.action as never),
    )
  );
}

function isGameProfileId(data: unknown): data is GameProfileId {
  return ALL_GAME_PROFILE_IDS.includes(data as never);
}

function isObsScene(data: unknown): data is ObsScene {
  return (
    isObject(data) &&
    typeof data.scene === "string" &&
    typeof data.start === "number"
  );
}

function isObsSceneSettings(data: unknown): data is ObsSceneSettings {
  return (
    isObject(data) &&
    ALL_OBS_SCENE_TYPES.every((type) => {
      const scenes = data[type];
      return Array.isArray(scenes) && scenes.every(isObsScene);
    })
  );
}

function isObsWebsocketSettings(data: unknown): data is ObsWebsocketSettings {
  return (
    isObject(data) &&
    typeof data.ip === "string" &&
    typeof data.port === "string"
  );
}

export class SettingsStore {
  private static dbInstance: RocksDatabase | undefined;

  private static slippiRelayMutex = new Mutex();

  private static db() {
    if (this.dbInstance === undefined) {
      this.dbInstance = RocksDatabase.open(
        path.join(app.getPath("userData"), "settings"),
      );
    }

    return this.dbInstance;
  }
  static async writeSlippiRelaySettings(
    settings: Partial<SlippiRelaySettings>,
  ) {
    await this.slippiRelayMutex.acquire();

    try {
      const saved = await this.db().get(DB_KEYS.slippiRelay);
      const current = isSlippiRelaySettings(saved)
        ? saved
        : DEFAULT_SLIPPI_RELAY_SETTINGS;
      await this.db().put(DB_KEYS.slippiRelay, { ...current, ...settings });
    } finally {
      this.slippiRelayMutex.release();
    }
    EventStream.notify(
      "toast",
      "Slippi Relay",
      "Relay settings saved successfully",
    );
  }

  static async getSlippiRelaySettings() {
    const saved = await this.db().get(DB_KEYS.slippiRelay);
    return isSlippiRelaySettings(saved) ? saved : undefined;
  }

  static async writeShortcutSettings(settings: ShortcutSettings) {
    await this.db().put(DB_KEYS.shortcuts, settings);
    EventStream.notify(
      "toast",
      "Shortcuts",
      "Shortcut settings successfully saved",
    );
  }

  static async getShortcuts() {
    const saved = await this.db().get(DB_KEYS.shortcuts);
    return isShortcutSettings(saved) ? saved : undefined;
  }

  static async writePlatformApiKey(platform: string, newApiKey: string) {
    await this.db().put(DB_KEYS.apiKey(platform), newApiKey);
    EventStream.notify(
      "toast",
      `${platform} API Key`,
      "Successfully saved API key",
    );
  }

  static async getPlatformApiKey(platform: string) {
    const key = await this.db().get(DB_KEYS.apiKey(platform));
    return typeof key === "string" ? key : "";
  }

  static async writeEventUrl(url: string) {
    await this.db().put(DB_KEYS.eventUrl, url);
  }

  // Returned unvalidated: only the renderer's platform registry knows which URL
  // shapes are recognised, and it drops anything it cannot parse.
  static async getEventUrl() {
    const url = await this.db().get(DB_KEYS.eventUrl);
    return typeof url === "string" ? url : "";
  }

  static async writeObsWebsocketSettings(settings: ObsWebsocketSettings) {
    await this.db().put(DB_KEYS.obsWebsocket, settings);
  }

  static async getObsWebsocketSettings() {
    const websocketSettings = await this.db().get(DB_KEYS.obsWebsocket);
    return isObsWebsocketSettings(websocketSettings)
      ? websocketSettings
      : undefined;
  }

  static async writeObsScenes(scenes: ObsSceneSettings) {
    await this.db().put(DB_KEYS.obsScenes, scenes);
  }

  static async getObsScenes() {
    const savedScenes = await this.db().get(DB_KEYS.obsScenes);

    return isObsSceneSettings(savedScenes)
      ? savedScenes
      : fromKeys(ALL_OBS_SCENE_TYPES, () => []);
  }

  static async writeGameProfile(gameProfile: GameProfileId) {
    await this.db().put(DB_KEYS.gameProfile, gameProfile);
  }

  static async getGameProfile() {
    const profile = await this.db().get(DB_KEYS.gameProfile);
    return isGameProfileId(profile) ? profile : "melee";
  }

  static close() {
    this.db().close();
  }
}

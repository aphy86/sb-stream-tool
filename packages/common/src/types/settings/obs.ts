export type ObsWebsocketSettings = {
  ip: string;
  port: string;
};

export type ObsScene = {
  scene: string;
  start: number;
};

export const ALL_OBS_SCENE_TYPES = [
  "game-start",
  "game-end",
  "set-end",
] as const;

export type ObsSceneType = (typeof ALL_OBS_SCENE_TYPES)[number];

export type ObsSceneSettings = { type: ObsSceneType; scene: ObsScene }[];

export type ObsConnectionStatus = "connected" | "disconnected" | "error";

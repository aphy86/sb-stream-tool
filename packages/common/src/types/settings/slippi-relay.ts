export const ALL_SLIPPI_RELAY_STATUSES = [
  "disabled",
  "console",
  "dolphin",
  "folder",
] as const;

export type SlippiRelayStatus = (typeof ALL_SLIPPI_RELAY_STATUSES)[number];

export type SlippiRelaySettings = {
  relayStatus: SlippiRelayStatus;
  directory: string;
  wiiIp: string;
  wiiPort: number;
  dolphinIp: string;
  dolphinPort: number;
};

export type SlippiPlayer = {
  character: string;
  color: string;
  playerId: number;
  port: number;
  teamId: number;
  teamShade?: number;
};

export type SlippiGameData = {
  isTeams: boolean;
  players: SlippiPlayer[][];
};

export type SlippiGameStartData = {
  isTeams: boolean;
  players: SlippiPlayer[][];
  isSameGame: boolean;
};

export type SlippiGameEndData = {
  isTeams: boolean;
  winners: number[]; // all the winners' playerindexes
};

type SlippiRelayConfigs = {
  folder: { listenPath: string };
  console: { ip: string; port: number };
  dolphin: { ip: string; port: number };
};

export type SlippiRelayType = keyof SlippiRelayConfigs;

export type SlippiRelayConfig<T extends SlippiRelayType = SlippiRelayType> = {
  [K in T]: { type: K } & SlippiRelayConfigs[K];
}[T];

export type SlippiConnectionStatus = {
  type: "wii" | "dolphin" | "folder" | "none";
  status: "connected" | "disconnected" | "connecting" | "error";
};

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

export type SlippiRelayConfig =
  | { type: "folder"; listenPath: string }
  | { type: "console"; ip: string; port: number }
  | { type: "dolphin"; ip: string; port: number };

export type SlippiConnectionStatus = {
  type: "wii" | "dolphin" | "folder" | "none";
  status: "connected" | "disconnected" | "connecting" | "error";
};

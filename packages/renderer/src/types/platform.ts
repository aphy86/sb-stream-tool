import type { PlayerInfo } from "@app/common";

export type PlatformId = "startgg" | "parrygg";

export type EventId = {
  platform: PlatformId;
  url: string;
  id: string;
};

export type SetState = "pending" | "ready" | "in-progress" | "completed";

export type PlatformEntrant = {
  name: string;
  players: PlayerInfo[];
};

export type PlatformSet = {
  matchName: string;
  state: SetState;
  stream: string;
  tournamentName: string;
  /** Always length 2, padded when the opponent is not yet known. */
  entrants: PlatformEntrant[];
};

export type FetchProgress = {
  loaded: number;
  total: number;
  tournamentName: string;
  sets: PlatformSet[];
};

export type ProgressCallback = (progress: FetchProgress) => void;

export interface TournamentPlatform {
  readonly id: PlatformId;
  readonly displayName: string;
  readonly apiKeyDocsUrl: string;
  /** When false, getSet still works but the UI does not offer it. */
  readonly supportsSetLookup: boolean;

  parseEventUrl(url: string): EventId | null;

  withApiKey(apiKey: string): PlatformClient;
}

export interface PlatformClient {
  getSet(setId: string): Promise<PlatformSet | null>;

  getSets(
    eventId: EventId,
    opts: { upcomingOnly: boolean },
    onProgress?: ProgressCallback,
  ): Promise<PlatformSet[]>;
}

import {
  EventId,
  PlatformClient,
  PlatformId,
  TournamentPlatform,
} from "@renderer/types/platform";
import { ParryggPlatform } from "./parrygg/ParryggPlatform";
import { StartggPlatform } from "./startgg/StartggPlatform";

export const PLATFORMS: TournamentPlatform[] = [
  StartggPlatform,
  ParryggPlatform,
];

export const CLIENTS: Map<string, Map<PlatformId, PlatformClient>> = new Map();

export function platformById(id: PlatformId): TournamentPlatform {
  const platform = PLATFORMS.find((candidate) => candidate.id === id);
  if (!platform) {
    throw new Error(`No tournament platform registered for id "${id}"`);
  }
  return platform;
}

/** Used when no event is selected. */
export function defaultPlatform(): TournamentPlatform {
  return PLATFORMS[0];
}

export function getPlatformByEventUrl(url: string): TournamentPlatform {
  const eventId = resolveEventUrl(url);
  return eventId ? platformById(eventId.platform) : defaultPlatform();
}

export function resolveEventUrl(url: string): EventId | null {
  for (const platform of PLATFORMS) {
    const eventId = platform.parseEventUrl(url);
    if (eventId) {
      return eventId;
    }
  }
  return null;
}

export function getClient(apiKey: string, platform: PlatformId) {
  const client = CLIENTS.get(apiKey)?.get(platform);

  if (client) return client;

  let newClient = platformById(platform).withApiKey(apiKey);

  let platformClients = CLIENTS.get(apiKey);

  if (!platformClients) {
    platformClients = new Map<PlatformId, PlatformClient>([
      [platform, newClient],
    ]);
    CLIENTS.set(apiKey, platformClients);
  } else {
    platformClients.set(platform, newClient);
  }

  return newClient;
}

import { ParryggPlatform } from "./parrygg/ParryggPlatform";
import { StartggPlatform } from "./startgg/StartggPlatform";
import type { EventId, PlatformId, TournamentPlatform } from "./types";

export const PLATFORMS: TournamentPlatform[] = [
  StartggPlatform,
  ParryggPlatform,
];

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

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ServerError,
} from "@apollo/client";
import type { PlayerInfo } from "@app/common";
import {
  EventSetsDocument,
  LiveEventSetsDocument,
  SetEntrantsDocument,
} from "@renderer/types/__generated__/graphql-types";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type {
  EventId,
  FetchProgress,
  PlatformClient,
  PlatformEntrant,
  PlatformId,
  PlatformSet,
  SetState,
  TournamentPlatform,
} from "@renderer/types/platform";
import { RequestScheduler } from "@renderer/rate-limit/RequestScheduler";
import {
  PLATFORM_RATE_LIMIT_SCHEDULERS,
  RATELIMIT_CONFIG,
} from "@renderer/rate-limit/registry";
import { isAbortError } from "@renderer/utils/helpers";

const PLATFORM_ID: PlatformId = "startgg";
const DISPLAY_NAME = "start.gg";
const API_KEY_DOCS_URL = "https://developer.start.gg/docs/authentication/";
const API_URL = "https://api.start.gg/gql/alpha";
const PER_PAGE = 50;
const UNKNOWN_EVENT_NAME = "Unknown Event";
const UNKNOWN_ROUND_NAME = "Custom Round Name";
const MAX_PAGE_ATTEMPTS = 5;

const EVENT_URL_PATTERN =
  /^https:\/\/(?:www\.)?start\.gg\/tournament\/([^/?#]+)\/event\/([^/?#]+)(?:[/?#].*)?$/;

type StartggParticipant = {
  prefix?: string | null;
  gamerTag?: string | null;
  user?: {
    genderPronoun?: string | null;
    authorizations?: ({ externalUsername?: string | null } | null)[] | null;
  } | null;
} | null;

type StartggSlot = {
  entrant?: {
    name?: string | null;
    participants?: StartggParticipant[] | null;
  } | null;
} | null;

type StartggSet = {
  fullRoundText?: string | null;
  state?: number | null;
  stream?: { streamName?: string | null } | null;
  slots?: StartggSlot[] | null;
};

const client = new ApolloClient({
  link: new HttpLink({ uri: API_URL }),
  cache: new InMemoryCache(),
});

function toSetState(state: number | null | undefined): SetState {
  switch (state) {
    case 2:
      return "in-progress";
    case 3:
      return "completed";
    case 4:
    case 6:
      return "ready";
    default:
      return "pending";
  }
}

function toPlayer(participant: StartggParticipant): PlayerInfo {
  return {
    teamName: participant?.prefix ?? "",
    playerTag: participant?.gamerTag ?? "",
    pronouns: participant?.user?.genderPronoun ?? "",
    socials: [
      {
        platform: "twitter",
        username:
          participant?.user?.authorizations?.[0]?.externalUsername ?? "",
      },
    ],
  };
}

function toEntrants(
  slots: StartggSlot[] | null | undefined,
): PlatformEntrant[] {
  const entrants: PlatformEntrant[] = [];

  for (const slot of slots ?? []) {
    if (!slot?.entrant?.participants) {
      continue;
    }
    entrants.push({
      name: slot.entrant.name ?? "",
      players: slot.entrant.participants.map(toPlayer),
    });
  }

  while (entrants.length > 0 && entrants.length < 2) {
    entrants.push({
      name: "",
      players: entrants[0].players.map(() => ({
        teamName: "",
        playerTag: "",
        pronouns: "",
        socials: [{ platform: "", username: "" }],
      })),
    });
  }

  return entrants;
}

function toPlatformSet(set: StartggSet, tournamentName: string): PlatformSet {
  return {
    matchName: set.fullRoundText ?? UNKNOWN_ROUND_NAME,
    state: toSetState(set.state),
    stream: set.stream?.streamName ?? "",
    tournamentName,
    entrants: toEntrants(set.slots),
  };
}

function mapSetListNode(
  node: StartggSet | null | undefined,
  tournamentName: string,
): PlatformSet | null {
  if (!node?.state || !node.slots) {
    return null;
  }

  const mapped = toPlatformSet(node, tournamentName);
  return mapped.entrants.length > 0 ? mapped : null;
}
class StartggClient implements PlatformClient {
  private scheduler: RequestScheduler;
  private abortControllers: Set<AbortController> = new Set();

  private currentAbortController: AbortController | null;

  private generation: number;

  constructor(private readonly apiKey: string) {
    this.scheduler =
      PLATFORM_RATE_LIMIT_SCHEDULERS.get("startgg") ??
      new RequestScheduler(
        RATELIMIT_CONFIG.startgg.maxRequests,
        RATELIMIT_CONFIG.startgg.windowMs,
      );
    this.currentAbortController = null;
    this.generation = 0;
  }

  abortRequest(): void {
    for (const controller of this.abortControllers) {
      controller.abort();
    }
  }

  private runQuery<TData, TVariables extends Record<string, unknown>>(
    document: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    signal?: AbortSignal,
  ) {
    return client.query({
      query: document,
      variables,
      fetchPolicy: "network-only",
      context: {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        fetchOptions: {
          signal: signal,
        },
      },
    });
  }

  async getSet(setId: string): Promise<PlatformSet | null> {
    const { data } = await this.runQuery(SetEntrantsDocument, { setId });

    if (!data?.set) {
      return null;
    }

    return toPlatformSet(data.set, data.set.event?.tournament?.name ?? "");
  }

  private async getPage(
    pageNum: number,
    eventId: EventId,
    opts: { upcomingOnly: boolean },
    signal?: AbortSignal,
  ) {
    const document = opts.upcomingOnly
      ? LiveEventSetsDocument
      : EventSetsDocument;

    for (let attempt = 0; attempt < MAX_PAGE_ATTEMPTS; attempt++) {
      try {
        await this.scheduler.acquire(signal);

        const response = await this.runQuery(
          document,
          { eventSlug: eventId.id, page: pageNum, perPage: PER_PAGE },
          signal,
        );

        return response.data;
      } catch (error) {
        if (ServerError.is(error) && error.statusCode === 429) {
          this.scheduler.rateLimitReached(0);
        } else throw error;
      }
    }

    return null;
  }

  /**
   * fetches data for a given page,
   * returns null if max attempts reached, and data if found
   */
  private async getPageSets(
    pageNum: number,
    eventId: EventId,
    opts: { upcomingOnly: boolean },
    signal?: AbortSignal,
  ) {
    const sets: PlatformSet[] = [];

    const pageData = await this.getPage(pageNum, eventId, opts, signal);

    if (!pageData) return null;

    const totalPages = pageData.event?.sets?.pageInfo?.totalPages ?? 0;

    const tournamentName =
      pageData.event?.tournament?.name ?? UNKNOWN_EVENT_NAME;

    for (const node of pageData.event?.sets?.nodes ?? []) {
      const mapped = mapSetListNode(node, tournamentName);
      if (mapped) sets.push(mapped);
    }

    return {
      totalPages: totalPages,
      tournamentName: tournamentName,
      sets: sets,
    };
  }

  async getSets(
    eventId: EventId,
    opts: { upcomingOnly: boolean },
    onProgress?: (progress: FetchProgress) => void,
  ): Promise<PlatformSet[]> {
    const allSets: PlatformSet[] = [];

    this.currentAbortController?.abort();
    this.generation++;
    const currentGeneration = this.generation;

    const abortController = new AbortController();
    this.currentAbortController = abortController;

    this.abortControllers.add(abortController);

    let eventName = "";
    let totalPages = 0;

    try {
      const firstPageSets = await this.getPageSets(
        1,
        eventId,
        opts,
        abortController.signal,
      );

      if (this.generation !== currentGeneration || !firstPageSets) return [];

      allSets.push(...firstPageSets.sets);

      eventName = firstPageSets.tournamentName;
      totalPages = firstPageSets.totalPages;

      onProgress?.({
        loaded: 1,
        total: totalPages,
        tournamentName: eventName,
        sets: firstPageSets.sets,
      });

      if (totalPages <= 1) return allSets;

      const CONCURRENT_WORKERS = 4;

      let currentPage = 2;
      let pagesLoaded = 1;

      const worker = async () => {
        while (
          this.generation === currentGeneration &&
          !abortController.signal.aborted
        ) {
          const page = currentPage++;

          if (page > totalPages) return;

          const pageSets = await this.getPageSets(
            page,
            eventId,
            opts,
            abortController.signal,
          );

          if (pageSets && this.generation === currentGeneration) {
            allSets.push(...pageSets.sets);
          } else return;

          pagesLoaded++;

          onProgress?.({
            loaded: pagesLoaded,
            total: totalPages,
            tournamentName: eventName,
            sets: pageSets.sets,
          });
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(CONCURRENT_WORKERS, totalPages - 1) },
          () =>
            worker().catch((error) => {
              if (isAbortError(error)) {
                return;
              }
              abortController.abort();
              throw error;
            }),
        ),
      );

      return this.generation === currentGeneration &&
        !abortController.signal.aborted
        ? allSets
        : [];
    } catch (error) {
      if (isAbortError(error)) {
        return [];
      }
      throw error;
    } finally {
      this.abortControllers.delete(abortController);
      if (this.currentAbortController === abortController) {
        this.currentAbortController = null;
      }
    }
  }
}

export const StartggPlatform: TournamentPlatform = {
  id: PLATFORM_ID,
  displayName: DISPLAY_NAME,
  apiKeyDocsUrl: API_KEY_DOCS_URL,
  supportsSetLookup: true,

  parseEventUrl(url) {
    const match = url.match(EVENT_URL_PATTERN);
    if (!match) {
      return null;
    }

    const [, tournamentSlug, eventSlug] = match;
    return {
      platform: PLATFORM_ID,
      url,
      id: `tournament/${tournamentSlug}/event/${eventSlug}`,
    };
  },

  withApiKey(apiKey) {
    return new StartggClient(apiKey);
  },
};

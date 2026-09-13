/* eslint-disable no-useless-escape */
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
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
} from "../types";

const PLATFORM_ID: PlatformId = "startgg";
const DISPLAY_NAME = "start.gg";
const API_KEY_DOCS_URL = "https://developer.start.gg/docs/authentication/";
const API_URL = "https://api.start.gg/gql/alpha";
const PER_PAGE = 50;
const UNKNOWN_EVENT_NAME = "unknown event";
const UNKNOWN_ROUND_NAME = "Custom Round Name";

const EVENT_URL_PATTERN =
  /^https:\/\/(?:www\.)?start\.gg\/tournament\/([^\/?#]+)\/event\/([^\/?#]+)(?:[\/?#].*)?$/;

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
  constructor(private readonly apiKey: string) {}

  private runQuery<TData, TVariables extends Record<string, unknown>>(
    document: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
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

  async getSets(
    eventId: EventId,
    opts: { upcomingOnly: boolean },
    onProgress?: (progress: FetchProgress) => void,
  ): Promise<PlatformSet[]> {
    const document = opts.upcomingOnly
      ? LiveEventSetsDocument
      : EventSetsDocument;
    const sets: PlatformSet[] = [];

    let tournamentName = UNKNOWN_EVENT_NAME;
    let totalPages = 1;

    for (let page = 1; page <= totalPages; page++) {
      const { data } = await this.runQuery(document, {
        eventSlug: eventId.id,
        page,
        perPage: PER_PAGE,
      });

      if (page === 1) {
        totalPages = data?.event?.sets?.pageInfo?.totalPages ?? 0;
        tournamentName = data?.event?.tournament?.name ?? UNKNOWN_EVENT_NAME;
      }

      const pageSets: PlatformSet[] = [];
      for (const node of data?.event?.sets?.nodes ?? []) {
        const mapped = mapSetListNode(node, tournamentName);
        if (mapped) {
          pageSets.push(mapped);
        }
      }
      sets.push(...pageSets);

      onProgress?.({
        loaded: page,
        total: totalPages,
        tournamentName,
        sets: pageSets,
      });
    }

    return sets;
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

import { getClient } from "@renderer/platform/registry";
import {
  EventId,
  FetchProgress,
  PlatformId,
  PlatformSet,
} from "@renderer/types/platform";
import { SetTableEntry } from "@renderer/types/tournament";
import { mapSetToTableRow } from "@renderer/utils/helpers";

export type EventSetsState = {
  tournamentName: string;
  sets: PlatformSet[];
  tableRows: SetTableEntry[];
  totalPages: number;
  pagesLoaded: number;
  loading: boolean;
};

const EMPTY_STATE: EventSetsState = {
  tournamentName: "Unknown Event",
  sets: [],
  tableRows: [],
  totalPages: 0,
  pagesLoaded: 0,
  loading: false,
};

class EventSetsStore {
  private states: Map<string, EventSetsState>;

  private listeners: Map<string, Set<() => void>>;

  private flushTimers: Map<string, NodeJS.Timeout>;

  private pendingRows: Map<string, SetTableEntry[]>;

  constructor() {
    this.states = new Map();
    this.listeners = new Map();
    this.flushTimers = new Map();
    this.pendingRows = new Map();
  }

  getSnapshot(key: string) {
    return this.states.get(key) ?? EMPTY_STATE;
  }

  subscribe(key: string, listener: () => void) {
    let currentListeners = this.listeners.get(key);

    if (!currentListeners) {
      currentListeners = new Set();
      this.listeners.set(key, currentListeners);
    }
    currentListeners.add(listener);

    return () => {
      currentListeners.delete(listener);
      if (currentListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  private notify(key: string) {
    this.listeners.get(key)?.forEach((listener) => listener());
  }

  private update(key: string, state: Partial<EventSetsState>) {
    const current = this.states.get(key) ?? EMPTY_STATE;
    this.states.set(key, { ...current, ...state });
    this.notify(key);
  }

  reset(key: string) {
    clearTimeout(this.flushTimers.get(key));
    this.flushTimers.delete(key);
    this.pendingRows.delete(key);
    this.states.set(key, { ...EMPTY_STATE });
    this.notify(key);
  }

  setLoading(key: string, loading: boolean) {
    this.update(key, { loading });
  }

  onProgress(key: string, progress: FetchProgress) {
    const current = this.states.get(key) ?? EMPTY_STATE;
    const newRows = progress.sets.map(mapSetToTableRow);

    const nextSets =
      progress.loaded === 1
        ? progress.sets
        : current.sets.concat(progress.sets);

    this.update(key, {
      tournamentName: progress.tournamentName,
      sets: nextSets,
      totalPages: progress.total,
      pagesLoaded: progress.loaded,
    });

    const pending = this.pendingRows.get(key) ?? [];
    pending.push(...newRows);
    this.pendingRows.set(key, pending);

    if (!this.flushTimers.has(key)) {
      const timer = setTimeout(() => {
        const rowsToFlush = this.pendingRows.get(key) ?? [];
        const state = this.states.get(key) ?? EMPTY_STATE;
        this.update(key, {
          tableRows: [...state.tableRows, ...rowsToFlush],
        });
        this.pendingRows.set(key, []);
        this.flushTimers.delete(key);
      }, 200);
      this.flushTimers.set(key, timer);
    }
  }
}

export const eventSetsStore = new EventSetsStore();

export async function fetchEventSets(
  key: string,
  apiKey: string,
  platform: PlatformId,
  eventId: EventId,
  opts: { upcomingOnly: boolean },
) {
  eventSetsStore.reset(key);
  eventSetsStore.setLoading(key, true);

  await getClient(apiKey, platform).getSets(eventId, opts, (progress) =>
    eventSetsStore.onProgress(key, progress),
  );

  eventSetsStore.setLoading(key, false);
}

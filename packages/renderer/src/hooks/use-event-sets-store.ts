import { EventSetsContext } from "@renderer/contexts/event-sets";
import { EventSetsState } from "@renderer/lib/EventSetsStore";
import { EventId, PlatformId } from "@renderer/types/platform";
import { use, useCallback, useSyncExternalStore } from "react";

export function useEventSetsStore(
  key: string,
): [typeof fetchEventSets, EventSetsState] {
  const context = use(EventSetsContext);

  if (context === undefined) {
    throw new Error(
      "useEventSetsStore must be used within a EventSetsProvider",
    );
  }

  const subscribe = useCallback(
    (onChange: () => void) => context.subscribe(key, onChange),
    [context, key],
  );

  const getSnapshot = useCallback(
    () => context.getSnapshot(key),
    [key, context],
  );

  const fetchEventSets = useCallback(
    (
      apiKey: string,
      platform: PlatformId,
      eventId: EventId,
      opts: {
        upcomingOnly: boolean;
      },
    ) => context.fetchEventSets(key, apiKey, platform, eventId, opts),
    [key, context],
  );

  return [fetchEventSets, useSyncExternalStore(subscribe, getSnapshot)];
}

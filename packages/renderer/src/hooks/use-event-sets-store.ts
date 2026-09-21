import { eventSetsStore } from "@renderer/lib/EventSetsStore";
import { useCallback, useSyncExternalStore } from "react";

export function useEventSetsStore(key: string) {
  const subscribe = useCallback(
    (onChange: () => void) => eventSetsStore.subscribe(key, onChange),
    [key],
  );

  const getSnapshot = useCallback(() => eventSetsStore.getSnapshot(key), [key]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

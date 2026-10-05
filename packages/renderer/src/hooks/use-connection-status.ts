import { ConnectionStatusContext } from "@renderer/contexts/connection-status";
import { use, useCallback, useSyncExternalStore } from "react";

export function useConnectionStatus(key: string) {
  const context = use(ConnectionStatusContext);

  if (context === undefined) {
    throw new Error(
      "useConnectionStatus must be used within a ConnectionStatusProvider",
    );
  }

  const subscribe = useCallback(
    (onChange: () => void) => context.subscribe(key, onChange),
    [context, key],
  );

  const getStatus = useCallback(() => context.get(key), [key, context]);

  return useSyncExternalStore(subscribe, getStatus);
}

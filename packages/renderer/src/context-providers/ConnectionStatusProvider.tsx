import { clearAllListeners, onConnectionStatusChange } from "@app/preload";
import { ConnectionStatusContext } from "@renderer/contexts/connection-status";
import { ConnectionStatusStore } from "@renderer/lib/ConnectionStatusStore";
import { ConnectionStatusProviderProps } from "@renderer/types/connection-status";
import { useEffect, useState } from "react";

export function ConnectionStatusProvider({
  children,
  connectionStatusMonitor,
  ...props
}: ConnectionStatusProviderProps) {
  const [connectionStatusStore] = useState(
    connectionStatusMonitor ?? new ConnectionStatusStore(),
  );

  useEffect(() => {
    onConnectionStatusChange((type, status) => {
      connectionStatusStore.update(type, status);
    });
    return () => clearAllListeners("connection-status/change");
  }, [connectionStatusStore]);

  return (
    <ConnectionStatusContext {...props} value={connectionStatusStore}>
      {children}
    </ConnectionStatusContext>
  );
}

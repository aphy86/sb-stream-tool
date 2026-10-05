import { ConnectionStatusStore } from "@renderer/lib/ConnectionStatusStore";

export type ConnectionStatusProviderProps = {
  children: React.ReactNode;
  connectionStatusMonitor?: ConnectionStatusStore;
};

import { ConnectionStatusStore } from "@renderer/lib/ConnectionStatusStore";
import { createContext } from "react";

export const ConnectionStatusContext = createContext<ConnectionStatusStore>(
  new ConnectionStatusStore(),
);

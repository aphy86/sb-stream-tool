import { ipcMain } from "electron";
// import { ObsController } from "./components/ObsController.js";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./types.js";
// import { FileHandler } from "./components/FileHandler.js";
// import { SlippiRelayHandler } from "./components/SlippiRelayHandler.js";
// import { ObsScene, Tournament } from "@app/common";
import { createHandlers } from "./handlers.js";

export function ipcSetup(
  mainSocket: Socket<ServerToClientEvents, ClientToServerEvents>,
): void {
  const handlers = createHandlers(mainSocket);
  Object.entries(handlers).forEach(([channel, fn]) => {
    ipcMain.handle(channel, (_event, ...args) => fn(...args));
  });
}

import { ipcMain } from "electron";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./types.js";
import { createHandlers } from "./handlers.js";

export function ipcSetup(
  mainSocket: Socket<ServerToClientEvents, ClientToServerEvents>,
): void {
  const handlers = createHandlers(mainSocket);
  Object.entries(handlers).forEach(([channel, fn]) => {
    ipcMain.handle(channel, (_event, ...args) => fn(...args));
  });
}

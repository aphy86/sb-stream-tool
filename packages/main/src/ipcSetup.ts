import { ipcMain } from "electron";
import { createHandlers } from "./handlers.js";

export function ipcSetup(): void {
  const handlers = createHandlers();
  Object.entries(handlers).forEach(([channel, fn]) => {
    ipcMain.handle(channel, (_event, ...args) => fn(...args));
  });
}

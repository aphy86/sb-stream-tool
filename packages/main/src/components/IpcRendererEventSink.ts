import { BrowserWindow } from "electron";
import { EventSink } from "./EventStream.js";

export type IpcRendererEvent =
  | "toast-message"
  | "connection-status/change"
  | "slippi-relay/new-game-start-data"
  | "slippi-relay/new-game-end-data"
  | "shortcut/global-event";

export class IpcRendererEventSink implements EventSink {
  private browserWindow: BrowserWindow;
  private channel: IpcRendererEvent;

  constructor(channel: IpcRendererEvent, browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
    this.channel = channel;
  }

  update(...args: unknown[]): void {
    if (!this.browserWindow.isDestroyed()) {
      this.browserWindow.webContents.send(this.channel, ...args);
    }
  }
}

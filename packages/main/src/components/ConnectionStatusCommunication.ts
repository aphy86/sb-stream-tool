import { BrowserWindow } from "electron";
import { EventSink } from "./EventStream.js";

export class ConnectionStatusCommunicator implements EventSink {
  private browserWindow: BrowserWindow;

  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  update(connectionType: string, status: string): void {
    if (this.browserWindow.isDestroyed()) {
      return;
    }
    this.browserWindow.webContents.send(
      "connection-status/change",
      connectionType,
      status,
    );
  }
}

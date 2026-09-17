import { BrowserWindow } from "electron";
import { EventSink } from "./EventStream.js";

export class ConnectionStatusCommunicator implements EventSink {
  private browserWindow: BrowserWindow;
  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  update(connectionStatus: { type: string; status: string }): void {
    this.browserWindow.webContents.send(
      "connection-status",
      connectionStatus.type,
      connectionStatus.status,
    );
  }
}

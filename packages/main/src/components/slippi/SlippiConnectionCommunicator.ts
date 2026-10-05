import { SlippiConnectionStatus } from "@app/common";
import { BrowserWindow } from "electron";
import { EventSink } from "../EventStream.js";

export class SlippiConnectionCommunicator implements EventSink {
  private browserWindow: BrowserWindow;
  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  update(status: SlippiConnectionStatus): void {
    this.browserWindow.webContents.send(
      "slippi-relay/connection-status-change",
      status,
    );
  }
}

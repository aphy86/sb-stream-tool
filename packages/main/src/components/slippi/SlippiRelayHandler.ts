import { SlippiRelayConfig } from "@app/common";
import { SlippiRelay } from "./SlippiRelay.js";
import { SlippiFolderRelay } from "./SlippiFolderRelay.js";
import { BrowserWindow } from "electron";
import { SlippiConsoleRelay } from "./SlippiConsoleRelay.js";
export class SlippiRelayHandler {
  private static relay: SlippiRelay | null = null;
  private static browserWindow: BrowserWindow | null = null;

  static setup(config: SlippiRelayConfig) {
    if (this.browserWindow === null) {
      return;
    }
    this.relay?.stop(false);
    if (config.type === "folder") {
      this.relay = new SlippiFolderRelay(config.listenPath, this.browserWindow);
    }
    if (config.type === "console") {
      this.relay = new SlippiConsoleRelay(
        config.ip,
        config.port,
        this.browserWindow,
      );
    }
    if (config.type === "dolphin") {
      console.log("dolphin");
    }
    this.relay?.start();
  }

  static setBrowserWindow(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  static setRelay(relay: SlippiRelay) {
    this.relay = relay;
  }

  static getRelay() {
    return this.relay;
  }

  static stopRelay(quiet: boolean) {
    this.relay?.stop(quiet);
  }
}

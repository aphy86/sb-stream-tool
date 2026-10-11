import { BrowserWindow } from "electron";

export interface SlippiRelay {
  setBrowserWindow: (browserWindow: BrowserWindow) => void;
  stop: () => Promise<void>;
  // setup: (...args: any) => Promise<void>;
  start: () => Promise<void>;
}

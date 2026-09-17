import type { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import { BrowserWindow, Menu } from "electron";
import type { AppInitConfig } from "../AppInitConfig.js";
import { join } from "path";
import { buildMenu } from "../Menu.js";
import { ObsController } from "../components/ObsController.js";
import { FileHandler } from "../components/FileHandler.js";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../types.js";
import { SocketioServer } from "../components/SocketioServer.js";
import { ToastMessageCommunicator } from "../components/ToastMessageCommunication.js";
import { ipcSetup } from "../Ipc.js";
import { EventStream } from "../components/EventStream.js";
import { SlippiRelayHandler } from "../components/slippi/SlippiRelayHandler.js";
import { ConnectionStatusCommunicator } from "../components/ConnectionStatusCommunication.js";

class WindowManager implements AppModule {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;

  private mainSocket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor({
    initConfig,
    openDevTools = false,
  }: {
    initConfig: AppInitConfig;
    openDevTools?: boolean;
  }) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;
    this.mainSocket = io("http://localhost:20242");
  }

  async enable({ app }: ModuleContext): Promise<void> {
    FileHandler.createDirs();
    SocketioServer.enable();
    ObsController.initEvents();

    await app.whenReady();

    ipcSetup(this.mainSocket);

    await this.restoreOrCreateWindow(true);
    app.on("second-instance", () => this.restoreOrCreateWindow(true));
    app.on("activate", () => this.restoreOrCreateWindow(true));
  }

  async attachAllObservers(browserWindow: BrowserWindow) {
    const toast = new ToastMessageCommunicator(browserWindow);
    const connectionStatusEmitter = new ConnectionStatusCommunicator(
      browserWindow,
    );
    EventStream.attach("toast", toast);
    EventStream.attach("connection", connectionStatusEmitter);
  }

  async attachWindow(browserWindow: BrowserWindow) {
    SlippiRelayHandler.setBrowserWindow(browserWindow);
    ObsController.setBrowserWindow(browserWindow);
    // SlippiRelayHandler.restoreFromConfig();
    this.attachAllObservers(browserWindow);

    const menu = buildMenu(browserWindow);
    Menu.setApplicationMenu(menu);
  }

  async createAndSetupWindow(): Promise<BrowserWindow> {
    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
      icon: join(import.meta.dirname, "..", "src", "assets", "icon.ico"),
    });

    await this.attachWindow(browserWindow);

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createAndSetupWindow();
    }

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      window?.webContents.openDevTools();
    }

    window.focus();

    return window;
  }
}

export function createWindowManagerModule(
  ...args: ConstructorParameters<typeof WindowManager>
) {
  return new WindowManager(...args);
}

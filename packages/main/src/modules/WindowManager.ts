import type { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import { BrowserWindow, Menu } from "electron";
import type { AppInitConfig } from "../AppInitConfig.js";
import { join } from "path";
import { buildMenu } from "../Menu.js";
import { ObsController } from "../components/ObsController.js";
import { EventStream } from "../components/EventStream.js";
import { ipcSetup } from "../ipcSetup.js";
import { ShortcutManager } from "../components/ShortcutManager.js";
import { SettingsStore } from "../components/SettingsStore.js";
import { IpcRendererEventSink } from "../components/IpcRendererEventSink.js";

class WindowManager implements AppModule {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;

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
  }

  setupCleanupHandlers(app: Electron.App) {
    app.on("will-quit", () => {
      ShortcutManager.clear();
      SettingsStore.close();
      ObsController.disconnect().catch(console.error);
    });
  }

  async enable({ app }: ModuleContext): Promise<void> {
    this.setupCleanupHandlers(app);
    await app.whenReady();
    ipcSetup();

    await Promise.all([
      ObsController.init().catch((e) =>
        console.error(`Failed to load OBS scenes: ${e}`),
      ),
      ShortcutManager.init().catch((e) =>
        console.error(`Failed to load shortcuts: ${e}`),
      ),
    ]);

    await this.restoreOrCreateWindow(true);
    app.on("second-instance", () => this.restoreOrCreateWindow(true));
    app.on("activate", () => this.restoreOrCreateWindow(true));
  }

  attachAllObservers(browserWindow: BrowserWindow) {
    EventStream.attach(
      "toast",
      new IpcRendererEventSink("toast-message", browserWindow),
    );
    EventStream.attach(
      "connection",
      new IpcRendererEventSink("connection-status/change", browserWindow),
    );
    EventStream.attach(
      "slippi-game-start",
      new IpcRendererEventSink(
        "slippi-relay/new-game-start-data",
        browserWindow,
      ),
    );
    EventStream.attach(
      "slippi-game-end",
      new IpcRendererEventSink("slippi-relay/new-game-end-data", browserWindow),
    );
    EventStream.attach(
      "global-shortcut",
      new IpcRendererEventSink("shortcut/global-event", browserWindow),
    );
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

    const menu = buildMenu(browserWindow);
    Menu.setApplicationMenu(menu);

    this.attachAllObservers(browserWindow);

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

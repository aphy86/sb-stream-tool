import { OBSWebSocket } from "obs-websocket-js";
import { EventStream } from "./EventStream.js";
import { ObsScene, ObsSceneType } from "@app/common";
import { SettingsStore } from "./SettingsStore.js";
import { BrowserWindow } from "electron";

class SceneCollection {
  private scenes: ObsScene[];
  private sceneTimeoutIds: NodeJS.Timeout[];
  private socket: OBSWebSocket;

  constructor(socket: OBSWebSocket) {
    this.sceneTimeoutIds = [];
    this.scenes = [];
    this.socket = socket;
  }

  stop() {
    for (const id of this.sceneTimeoutIds) {
      clearTimeout(id);
    }
    this.sceneTimeoutIds = [];
  }

  async play() {
    this.stop();
    for (const scene of this.scenes) {
      this.sceneTimeoutIds.push(
        setTimeout(() => {
          this.socket
            .call("SetCurrentProgramScene", {
              sceneName: scene.scene,
            })
            .catch((err) => {
              console.log(`Error: ${err}`);
            });
        }, scene.start),
      );
    }
  }

  async update(newScenes: ObsScene[]) {
    this.stop();
    this.scenes = newScenes;
  }
}

export class ObsController {
  private static socket: OBSWebSocket = new OBSWebSocket();
  private static gameStartScenes: SceneCollection = new SceneCollection(
    this.socket,
  );
  private static gameEndScenes: SceneCollection = new SceneCollection(
    this.socket,
  );
  private static setEndScenes: SceneCollection = new SceneCollection(
    this.socket,
  );

  private static browserWindow: BrowserWindow | null = null;

  // constructor() {
  //   super();
  //   this.socket = new OBSWebSocket();
  //   this.gameStartScenes = new SceneCollection(this.socket);
  //   this.setEndScenes = new SceneCollection(this.socket);
  //   this.gameEndScenes = new SceneCollection(this.socket);
  // }

  static async setBrowserWindow(window: BrowserWindow) {
    this.browserWindow = window;
  }

  static async connect(
    protocol: string,
    url: string,
    port: string,
    password: string,
  ) {
    EventStream.notify(
      "toast",
      "OBS Websocket connection",
      `Connecting to ${protocol}${url}:${port}`,
    );
    await this.socket
      .connect(`${protocol}${url}:${port}`, password)
      .then(() => {
        // EventStream.notify(
        //   "OBS Websocket connection",
        //   `Connected to ${protocol}${url}:${port}`,
        // );
        console.log("Connected");
      })
      .catch((reason) => {
        EventStream.notify("obs", "error");
        EventStream.notify("toast", "Obs Connection Error", reason.message);
        console.log(`Error: ${reason}`);
      });
  }

  static async disconnect() {
    await this.socket.disconnect();
    EventStream.notify("toast", "OBS Websocket connection", `Disconnected`);
  }

  static async playScenes(sceneCollection: ObsSceneType) {
    switch (sceneCollection) {
      case "game-start":
        this.gameStartScenes.play();
        break;
      case "game-end":
        this.gameEndScenes.play();
        break;
      case "set-end":
        this.setEndScenes.play();
        break;
      default:
        throw new Error(`Scene collection not found: ${sceneCollection}`);
    }
  }

  static async stopScenes(sceneCollection: ObsSceneType) {
    switch (sceneCollection) {
      case "game-start":
        this.gameStartScenes.stop();
        break;
      case "game-end":
        this.gameEndScenes.stop();
        break;
      case "set-end":
        this.setEndScenes.stop();
        break;
      default:
        throw new Error(`Scene collection not found: ${sceneCollection}`);
    }
  }

  static async updateScenes(
    newGameStartScenes: ObsScene[],
    newGameEndScenes: ObsScene[],
    newSetEndScenes: ObsScene[],
  ) {
    this.gameStartScenes.update(newGameStartScenes);
    this.gameEndScenes.update(newGameEndScenes);
    this.setEndScenes.update(newSetEndScenes);
    EventStream.notify("toast", "OBS scenes", "OBS scenes added!");
  }

  static async initEvents() {
    this.socket.on("ConnectionError", (error) => {
      console.log("OBS Websocket Connection Error");
      EventStream.notify("connection", {
        type: "obs",
        status: "error",
      });
      EventStream.notify(
        "toast",
        "OBS Connection Error",
        `Connection Error: ${error}`,
      );
    });

    this.socket.on("ConnectionClosed", () => {
      console.log("OBS Websocket Connection Closed");
      EventStream.notify("connection", {
        type: "obs",
        status: "disconnected",
      });
      EventStream.notify("toast", "OBS Connection Closed", `Disconnected`);
    });

    this.socket.on("ConnectionOpened", () => {
      console.log("OBS Websocket Connection Opened");
      EventStream.notify("connection", {
        type: "obs",
        status: "connected",
      });
      EventStream.notify(
        "toast",
        "OBS Connection Success",
        "Connection Opened",
      );
    });

    this.socket.on("CurrentProgramSceneChanged", (scene) => {
      console.log(`Scene Changed to ${scene.sceneName}`);
      EventStream.notify(
        "toast",
        "OBS Scene Change",
        `Scene Changed to ${scene.sceneName}`,
      );
    });

    const scenes = await SettingsStore.getObsScenes();
    if (scenes !== undefined) {
      const gameStartScenes = [] as ObsScene[];
      const gameEndScenes = [] as ObsScene[];
      const setEndScenes = [] as ObsScene[];
      for (const scene of scenes) {
        switch (scene.type) {
          case "game-start":
            gameStartScenes.push(scene.scene);
            break;
          case "game-end":
            gameEndScenes.push(scene.scene);
            break;
          case "set-end":
            setEndScenes.push(scene.scene);
            break;
          default:
            throw new Error(
              `UNKNOWN TYPE, idk how you even got this on a known typed value`,
            );
        }
      }
      this.updateScenes(gameStartScenes, gameEndScenes, setEndScenes);
    }
  }
}

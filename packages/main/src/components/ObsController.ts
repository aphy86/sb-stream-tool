import { OBSWebSocket } from "obs-websocket-js";
import { EventStream } from "./EventStream.js";
import {
  ALL_OBS_SCENE_TYPES,
  fromKeys,
  ObsScene,
  ObsSceneSettings,
  ObsSceneType,
} from "@app/common";
import { SettingsStore } from "./SettingsStore.js";

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

  play() {
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

  update(newScenes: ObsScene[]) {
    this.stop();
    this.scenes = newScenes;
  }

  getScenes() {
    return this.scenes;
  }
}

export class ObsController {
  private static socket: OBSWebSocket = new OBSWebSocket();
  private static sceneCollections = fromKeys(
    ALL_OBS_SCENE_TYPES,
    () => new SceneCollection(this.socket),
  );
  // private static browserWindow: BrowserWindow | null = null;

  // static async setBrowserWindow(window: BrowserWindow) {
  //   this.browserWindow = window;
  // }

  static getScenes(): ObsSceneSettings {
    return fromKeys(ALL_OBS_SCENE_TYPES, (type) =>
      this.sceneCollections[type].getScenes(),
    );
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
        console.log(`OBS Websocket Connected to ${protocol}${url}:${port}`);
      })
      .catch((reason) => {
        EventStream.notify(
          "toast",
          "Obs Websocket Connection Error",
          reason.message,
        );
        console.log(`Obs Websocket error: ${reason}`);
      });
  }

  static async disconnect() {
    await this.socket.disconnect();
  }

  static playScenes(type: ObsSceneType) {
    this.sceneCollections[type].play();
  }

  static stopScenes(type: ObsSceneType) {
    this.sceneCollections[type].stop();
  }

  private static setScenes(scenes: ObsSceneSettings) {
    for (const type of ALL_OBS_SCENE_TYPES) {
      this.sceneCollections[type].update(scenes[type]);
    }
  }

  /**
   *
   * save scenes to file, and then save that to obscontroller
   */
  static async updateScenes(scenes: ObsSceneSettings) {
    await SettingsStore.writeObsScenes(scenes);
    this.setScenes(scenes);
    EventStream.notify("toast", "OBS scenes", "OBS scenes saved!");
    return scenes;
  }

  static async init() {
    this.socket.on("ConnectionError", (error) => {
      console.log("OBS Websocket Connection Error");
      EventStream.notify("connection", {
        type: "obs-websocket",
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
        type: "obs-websocket",
        status: "disconnected",
      });
      EventStream.notify("toast", "OBS Connection Closed", `Disconnected`);
    });

    this.socket.on("ConnectionOpened", () => {
      console.log("OBS Websocket Connection Opened");
      EventStream.notify("connection", {
        type: "obs-websocket",
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

    this.setScenes(await SettingsStore.getObsScenes());
  }
}

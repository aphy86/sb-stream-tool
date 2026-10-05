import { onGameProfileChange, send } from "@app/preload";
import { useSettingsStore } from "./store";
import { PLATFORMS, resolveEventUrl } from "@renderer/platform/registry";
import {
  ObsScene,
  ObsSceneSettings,
  ObsWebsocketSettings,
  ShortcutSettings,
  SlippiRelaySettings,
} from "@app/common";
import { defaultShortcuts } from "./slices/shortcutsSlice";
import { Hotkey } from "@tanstack/react-hotkeys";
import { getProfileById } from "@renderer/game-profiles/registry";

function ipcSetup() {
  onGameProfileChange((profileId) => {
    const newGameProfile = getProfileById(profileId);
    useSettingsStore.setState({
      gameProfile: newGameProfile,
    });
  });
}

export function setup() {
  // restore settings
  // https://github.com/pmndrs/zustand/discussions/676
  Promise.all([
    ...PLATFORMS.map((platform) =>
      send("platform/get-credential", platform.id)
        .then((key: string) => {
          useSettingsStore.setState((state) => ({
            credentials: { ...state.credentials, [platform.id]: key },
          }));
        })
        .catch((error) => console.log(error)),
    ),
    send("shortcuts/get-shortcuts")
      .then((shortcutsList: ShortcutSettings | undefined) => {
        if (shortcutsList === undefined) return;
        const retrievedShortcuts = new Map(defaultShortcuts);
        shortcutsList.forEach((shortcut) =>
          retrievedShortcuts.set(shortcut.action, shortcut.hotkey as Hotkey),
        );
        useSettingsStore.setState({ shortcuts: retrievedShortcuts });
      })
      .catch((error) => console.log(error)),
    send("obs/get-settings")
      .then(
        (settings: {
          websocket: ObsWebsocketSettings | undefined;
          scenes: ObsSceneSettings | undefined;
        }) => {
          if (settings.websocket !== undefined) {
            useSettingsStore.setState({
              websocketIp: settings.websocket.ip,
              websocketPort: settings.websocket.port,
            });
          }

          if (settings.scenes !== undefined) {
            const gameStartScenes = [] as ObsScene[];
            const gameEndScenes = [] as ObsScene[];
            const setEndScenes = [] as ObsScene[];

            settings.scenes.forEach((scene) => {
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
                  throw new Error(`UNKNOWN TYPE`);
              }
            });
            useSettingsStore.setState({
              gameStartScenes: gameStartScenes,
              gameEndScenes: gameEndScenes,
              setEndScenes: setEndScenes,
            });
          }
        },
      )
      .catch((error) => console.log(error)),
    send("slippi-relay/get-settings")
      .then((settings: SlippiRelaySettings | undefined) => {
        if (settings === undefined) return;
        useSettingsStore.setState({
          slippiRelayStatus: settings.relayStatus,
          slippiRelayDirectory: settings.directory,
          slippiWiiRelayIp: settings.wiiIp,
          slippiWiiRelayPort: settings.wiiPort,
          slippiDolphinRelayIp: settings.dolphinIp,
          slippiDolphinRelayPort: settings.dolphinPort,
        });
      })
      .catch((error) => console.log(error)),
    send("platform/get-event-url")
      .then((url: string) => {
        const eventId = resolveEventUrl(url);
        if (!eventId) return;
        useSettingsStore.setState({
          eventUrl: eventId.url,
          eventSlug: eventId.id,
        });
      })
      .catch((error) => console.log(error)),
    send("game-profile/get").then((newProfile) => {
      const profile = getProfileById(newProfile);
      useSettingsStore.setState({
        gameProfile: profile,
      });
    }),
  ])
    .then(() => {
      console.log("All state restored");
    })
    .catch((error) => {
      throw error;
    });

  ipcSetup();
  useSettingsStore.setState({
    isSettingsHydrated: true,
  });
}

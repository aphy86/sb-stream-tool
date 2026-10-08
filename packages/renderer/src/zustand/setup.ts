import { onGameProfileChange, send } from "@app/preload";
import { useSettingsStore } from "./store";
import { PLATFORMS, resolveEventUrl } from "@renderer/platform/registry";
import {
  ObsSceneSettings,
  ObsWebsocketSettings,
  ShortcutSettings,
  SlippiRelaySettings,
} from "@app/common";
import { toShortcutMap } from "./slices/shortcutsSlice";
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
      .then((list: ShortcutSettings) =>
        useSettingsStore.setState({ shortcuts: toShortcutMap(list) }),
      )
      .catch((error) => console.log(error)),
    send("obs/get-settings")
      .then(
        (settings: {
          websocket: ObsWebsocketSettings | undefined;
          scenes: ObsSceneSettings;
        }) => {
          if (settings.websocket) {
            useSettingsStore.setState({
              websocketIp: settings.websocket.ip,
              websocketPort: settings.websocket.port,
            });
          }
          useSettingsStore.setState({ scenes: settings.scenes });
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
    send("game-profile/get")
      .then((newProfile) => {
        const profile = getProfileById(newProfile);
        useSettingsStore.setState({
          gameProfile: profile,
        });
      })
      .catch(console.error),
  ])
    .then(() => {
      console.log("All state restored");
    })
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      ipcSetup();
      useSettingsStore.setState({
        isSettingsHydrated: true,
      });
    });
}

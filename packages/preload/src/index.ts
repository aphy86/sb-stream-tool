import {
  SlippiGameStartData,
  SlippiGameEndData,
  Match,
  GameProfileId,
  GlobalAction,
} from "@app/common";
import { ipcRenderer } from "electron";

function send(channel: string, ...args: any[]) {
  return ipcRenderer.invoke(channel, ...args);
}

function redirect(callback: (location: string) => void) {
  ipcRenderer.on("redirect", (_event, location) => callback(location));
}

function toastMessage(
  callback: (message?: string, description?: string) => void,
) {
  ipcRenderer.on("toast-message", (_event, message, description) =>
    callback(message, description),
  );
}

function updateOverlay(data: Match) {
  return ipcRenderer.invoke("overlay/update", data);
}

function clearAllListeners(channel: string) {
  ipcRenderer.removeAllListeners(channel);
}

function onNewSlippiRelayGameStartData(
  callback: (data: SlippiGameStartData) => void,
) {
  ipcRenderer.on("slippi-relay/new-game-start-data", (_event, data) =>
    callback(data),
  );
}

function onNewSlippiRelayGameEndData(
  callback: (winner: SlippiGameEndData) => void,
) {
  ipcRenderer.on("slippi-relay/new-game-end-data", (_event, winner) =>
    callback(winner),
  );
}

function onConnectionStatusChange(
  callback: (type: string, status: string) => void,
) {
  ipcRenderer.on("connection-status/change", (_event, type, status) =>
    callback(type, status),
  );
}

function onGameProfileChange(callback: (profileId: GameProfileId) => void) {
  ipcRenderer.on("profile/change", (_event, profileId) => callback(profileId));
}

function onGlobalShortcut(callback: (action: GlobalAction) => void) {
  const listener = (_e: Electron.IpcRendererEvent, action: GlobalAction) =>
    callback(action);
  ipcRenderer.on("shortcut/global-event", listener);
  return () => {
    ipcRenderer.removeListener("shortcut/global-event", listener);
  };
}

export {
  send,
  updateOverlay,
  redirect,
  toastMessage,
  onNewSlippiRelayGameStartData,
  onNewSlippiRelayGameEndData,
  clearAllListeners,
  onConnectionStatusChange,
  onGameProfileChange,
  onGlobalShortcut,
};

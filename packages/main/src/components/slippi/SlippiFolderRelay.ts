import chokidar, { FSWatcher } from "chokidar";
import { SlippiRelay } from "./SlippiRelay.js";
import {
  Frames,
  FramesType,
  GameEndType,
  GameStartType,
  SlippiGame,
} from "@slippi/slippi-js/node";
import { BrowserWindow } from "electron";
import path from "node:path";
import { EventStream } from "../EventStream.js";
import {
  getSlippiGameKey,
  getStartGameData,
  getWinners,
  isActualGame,
} from "./helpers.js";
import { SlippiGameEndData, SlippiGameStartData } from "@app/common";

export class SlippiFolderRelay implements SlippiRelay {
  private watcher?: FSWatcher;
  private currentGame?: {
    path: string;
    game: SlippiGame;
    started: boolean;
    ended: boolean;
  };
  private previousGame: string;
  private browserWindow: BrowserWindow;
  private listenPath: string;

  constructor(listenPath: string, browserWindow: BrowserWindow) {
    this.listenPath = listenPath;
    this.browserWindow = browserWindow;
    this.previousGame = "";
  }

  private getAllDamages(frames: FramesType, lastFrame: number) {
    const lastPercent = new Map<number, number>();
    let total = 0;
    for (let f = Frames.FIRST; f <= lastFrame; f++) {
      for (const player of Object.values(frames[f]?.players ?? {})) {
        const { playerIndex, percent } = player?.post ?? {};
        if (playerIndex !== undefined && percent !== undefined) {
          const taken = percent - (lastPercent.get(playerIndex) ?? 0);
          if (taken > 0) {
            total += taken;
          }
          lastPercent.set(playerIndex, percent);
        }
      }
    }
    return total;
  }

  private isActualReplayFile(filePath: string) {
    return path.extname(filePath) === ".slp";
  }

  setBrowserWindow(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  private sendToast(message: string) {
    EventStream.notify("toast", "Slippi Folder Relay", message);
  }

  private sendStatus(status: string) {
    EventStream.notify("connection", "slippi-folder", status);
  }

  private sendGameEnd(
    currentGame: SlippiGame,
    settings: GameStartType,
    currentGameEnd: GameEndType,
  ) {
    const lastFrame = currentGame.getLatestFrame();

    if (
      !isActualGame(
        lastFrame?.frame,
        this.getAllDamages(
          currentGame.getFrames(),
          lastFrame?.frame ?? Frames.FIRST,
        ),
      )
    )
      return;

    const winnersIndices = getWinners(settings, lastFrame, currentGameEnd);

    if (winnersIndices.length === 0) return;

    const data: SlippiGameEndData = {
      isTeams: settings.isTeams ?? false,
      winners: winnersIndices,
    };

    this.browserWindow.webContents.send("slippi-relay/new-game-end-data", data);
  }

  private sendGameStart(settings: GameStartType) {
    const newGameData = getStartGameData(settings);
    if (!newGameData) return;

    const currentGame = getSlippiGameKey(newGameData);

    const data: SlippiGameStartData = {
      isTeams: newGameData.isTeams,
      players: newGameData.players,
      isSameGame: currentGame === this.previousGame,
    };

    this.browserWindow.webContents.send(
      "slippi-relay/new-game-start-data",
      data,
    );

    this.previousGame = currentGame;
  }

  private update() {
    if (!this.currentGame || this.currentGame.ended) return;

    let settings: GameStartType | undefined;
    let gameEnd: GameEndType | undefined;

    try {
      settings = this.currentGame.game.getSettings();
      gameEnd = this.currentGame.game.getGameEnd();
    } catch (err) {
      console.error(err);
      return;
    }

    if (!this.currentGame.started && settings) {
      this.currentGame.started = true;
      this.sendGameStart(settings);
    }

    if (this.currentGame.started && settings && gameEnd) {
      this.currentGame.ended = true;
      this.sendGameEnd(this.currentGame.game, settings, gameEnd);
    }
  }
  async start() {
    this.watcher = chokidar.watch(this.listenPath, {
      ignored: (p, s) => !!s?.isFile() && !this.isActualReplayFile(p),
      ignoreInitial: true,
    });

    this.watcher.on("add", (p) => {
      if (!this.isActualReplayFile(p)) return;
      this.currentGame = {
        path: p,
        game: new SlippiGame(p),
        started: false,
        ended: false,
      };
      this.update();
    });

    this.watcher.on("change", (p) => {
      if (!this.currentGame && this.isActualReplayFile(p)) {
        this.currentGame = {
          path: p,
          game: new SlippiGame(p),
          started: false,
          ended: false,
        };
        // if the user started watching after the game ended, let the relay know
        if (this.currentGame?.game.getGameEnd()) {
          this.currentGame.ended = true;
        }
      }

      if (p === this.currentGame?.path) {
        this.update();
      }
    });

    this.watcher.on("error", (err) => {
      console.error(err);
      this.sendToast(`Error: ${err}`);
      this.sendStatus("error");
    });

    this.watcher.on("ready", () => {
      this.sendToast(`Watching ${this.listenPath} for games`);
      this.sendStatus("connected");
    });
  }

  async stop() {
    await this.watcher?.close();
    this.watcher = undefined;
    this.currentGame = undefined;
    this.sendToast("Stopped Relay");
    this.sendStatus("disconnected");
  }
}

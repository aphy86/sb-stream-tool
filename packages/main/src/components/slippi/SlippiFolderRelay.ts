import chokidar, { FSWatcher } from "chokidar";
import { SlippiRelay } from "./SlippiRelay.js";
import { BrowserWindow } from "electron";
import {
  SlippiGameData,
  SlippiGameEndData,
  SlippiGameStartData,
} from "@app/common";
import {
  GameEndType,
  GameStartType,
  MetadataType,
  SlippiGame,
  StatsType,
  characters as characterUtils,
} from "@slippi/slippi-js/node";
import { SlippiSettingsData } from "../../types.js";
import { EventStream } from "../EventStream.js";
import { getStartGameData, isSameGame } from "./helpers.js";

export class SlippiFolderRelay implements SlippiRelay {
  private browserWindow: BrowserWindow;
  private watcher: FSWatcher;
  private listenPath: string;
  private previousPlayers: SlippiGameData | null;
  // settings field in games is used to detect if game started or not, see line 97-100 of https://github.com/project-slippi/slippi-js/blob/master/src/common/SlippiGameBase.ts
  // possibly delete all handwarmers games tbh
  private games: Map<string, SlippiSettingsData>;

  constructor(listenPath: string, browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
    this.listenPath = listenPath;
    this.previousPlayers = null;
    this.games = new Map();
    this.watcher = chokidar.watch(listenPath, {
      ignored: "!*.slp", // TODO: This doesn't work. Use regex?
      depth: 0,
      persistent: true,
      usePolling: true,
      ignoreInitial: true,
    });
    EventStream.notify("toast", `Saved and connected to ${listenPath}`);
  }

  async setBrowserWindow(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  private isActualGame(
    metadata: MetadataType | undefined,
    gameEnd: GameEndType | undefined,
    stats: StatsType | undefined,
  ) {
    if (!metadata || !gameEnd || !stats) return false;

    if (metadata.lastFrame && metadata.lastFrame > 6000) return true;

    const allDamageDealt = stats.overall.map((s) => s.totalDamage);
    const totalDamage = allDamageDealt.reduce((a, b) => a + b, 0);
    if (totalDamage > 100) return true;

    // lras = LT + RT + A + START
    const lras = gameEnd.gameEndMethod === 7;

    return (lras && totalDamage > 100) || (!lras && totalDamage > 100); // this could be better tbh ill figure it out later
  }

  async start() {
    this.watcher?.on("change", (path) => {
      let gameState: SlippiSettingsData["state"] | undefined,
        settings: GameStartType | undefined,
        gameEnd: GameEndType | undefined,
        // metadata: MetadataType | undefined,
        game: SlippiSettingsData | undefined;
      try {
        if (!this.games.get(path)?.gameDataController) {
          // new file detected, but this doesn't necessarily mean a new game has started (possibly could be a delay between actual game starting and the file being created)
          this.games.set(path, {
            gameDataController: new SlippiGame(path, { processOnTheFly: true }),
            state: {
              settings: undefined,
              gameEnded: false,
            },
          });
        }

        game = this.games.get(path);
        gameState = game?.state;
        settings = game?.gameDataController.getSettings();
        gameEnd = game?.gameDataController.getGameEnd();
      } catch (err) {
        EventStream.notify("toast", "Slippi Relay Error");
        return;
      }
      if (!gameState?.settings && settings) {
        // a new game has ACTUALLY started, since the settings portion didn't exist before and there are new settings
        const newGameData = getStartGameData(settings);

        if (newGameData === undefined) return;
        // now check if it's a runback with the same characters, and the set isn't over
        const sameGame = isSameGame(newGameData, this.previousPlayers);

        const data: SlippiGameStartData = {
          isTeams: newGameData.isTeams,
          players: newGameData.players,
          isSameGame: sameGame,
        };

        this.browserWindow.webContents.send("slippi:new-game-start-data", data);

        this.previousPlayers = newGameData;
      }
      game = this.games.get(path);
      if (game?.state) {
        game.state.settings = settings;
        this.games.set(path, game);
      }
      // 3rd condition is to avoid duplicates
      if (
        game &&
        gameEnd !== undefined &&
        game.state.gameEnded === false &&
        game.state.settings?.isTeams !== undefined
      ) {
        if (
          this.isActualGame(
            game.gameDataController.getMetadata(),
            gameEnd,
            game.gameDataController.getStats(),
          )
        ) {
          let gameWinners = game.gameDataController.getWinners();
          if (gameWinners.length > 0) {
            const gameEndData: SlippiGameEndData = {
              isTeams: game.state.settings.isTeams,
              winners: gameWinners.map((winner) => winner.playerIndex),
            };
            this.browserWindow?.webContents.send(
              "slippi:new-game-end-data",
              gameEndData,
            );
            console.log(
              `winners = ${gameEndData.winners}, isTeam = ${gameEndData.isTeams}, gameEnded = ${game.state.gameEnded}`,
            );
          }
        }
        // chokidar does sometimes fire twice on one slippi file a second apart from each other: this could be because of a slight change in the file, metadata flush, some small, very minute, irrelevant change to the file/buffer via os, etc
        // so we must ensure the file end stuff only gets read once
        game.state.gameEnded = true;
        this.games.set(path, game);
      }
    });
  }

  async stop(quiet: boolean) {
    if (this.listenPath) {
      this.watcher?.unwatch(this.listenPath);
      this.watcher?.close();
      this.listenPath = "";
    }

    if (!quiet) {
      EventStream.notify("toast", "Slippi Relay", "Stopped Relay");
    }
  }

  // async setup() {
  //   this.watcher = chokidar.watch(this.listenPath, {
  //     ignored: "!*.slp", // TODO: This doesn't work. Use regex?
  //     depth: 0,
  //     persistent: true,
  //     usePolling: true,
  //     ignoreInitial: true,
  //   });

  //   this.read();
  //   EventStream.notify("Slippi Folder Relay", "Started Folder Relay");
  // }
}

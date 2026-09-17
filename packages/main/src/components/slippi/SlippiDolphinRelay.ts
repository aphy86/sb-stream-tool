import { BrowserWindow } from "electron";
import { SlippiRelay } from "./SlippiRelay.js";
import {
  ConnectionStatus,
  DolphinConnection,
  FrameEntryType,
  GameStartType,
  SlpParser,
  SlpStream,
} from "@slippi/slippi-js/node";
import {
  SlippiGameData,
  SlippiGameEndData,
  SlippiGameStartData,
} from "@app/common";
import {
  getStartGameData,
  getWinner,
  isActualGame,
  isSameGame,
} from "./helpers.js";
import { EventStream } from "../EventStream.js";

export class SlippiDolphinRelay implements SlippiRelay {
  private browserWindow: BrowserWindow;
  private ip: string;
  private port: number;
  private connection: DolphinConnection;
  private parser: SlpParser;
  private stream: SlpStream;
  private games: Map<
    number,
    { settings: GameStartType | undefined; gameEnded: boolean }
  >;
  private gameNumber: number; // to keep track of games that have ended so duplicate game end calls won't happen, see line 127-128 of SlippiFolderRelay.ts for a general idea of what i mean
  private previousPlayers: SlippiGameData | null;
  private playerDamages: Map<number, number>;
  private lastFrame: FrameEntryType | null;

  constructor(ip: string, port: number, browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
    this.ip = ip;
    this.port = port;
    this.connection = new DolphinConnection();
    this.parser = new SlpParser();
    this.stream = new SlpStream();
    this.gameNumber = 1;
    this.previousPlayers = null;
    this.games = new Map();
    this.playerDamages = new Map();
    this.lastFrame = null;
  }

  async setBrowserWindow(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  async clearPrevGame() {
    this.playerDamages.clear();
    this.lastFrame = null;
    this.previousPlayers = null;
  }

  async start() {
    // console.log("Connecting");
    try {
      await this.connection.connect(this.ip, this.port);
    } catch (err) {
      console.log(`Error, ${err}`);
      return;
    }

    // feeding wii data into the slpstream
    this.connection.on("data", (data) => this.stream.process(data));

    // connection status changes
    this.connection.on("connect", () =>
      EventStream.notify("toast", `Connecting to ${this.ip}:${this.port}`),
    ); // this for "connecting"
    this.connection.on("statusChange", (data) => {
      switch (data) {
        case ConnectionStatus.CONNECTED:
          EventStream.notify("toast", `Connected to ${this.ip}:${this.port}`);
          EventStream.notify("slippi", { type: "wii", status: "connected" });
          break;
        case ConnectionStatus.DISCONNECTED:
          EventStream.notify("toast", `Slippi Wii Relay disconnected`);
          EventStream.notify("slippi", { type: "wii", status: "disconnected" });

          break;
        case ConnectionStatus.RECONNECT_WAIT:
          EventStream.notify("toast", `Reconnecting ${this.ip}:${this.port}`);
          EventStream.notify("slippi", { type: "wii", status: "connecting" });
          break;
        default:
          EventStream.notify("toast", `Connecting to ${this.ip}:${this.port}`);
          EventStream.notify("slippi", { type: "wii", status: "connecting" });
      }
    }); // this for any sort of connection success/error status changes
    this.connection.on("error", (err) =>
      EventStream.notify("toast", `Slippi Wii Connection error, ${err}`),
    ); // this for purely connection errors

    // any sort of event triggered will be passed onto the parser for handling
    this.stream.on("slp-command", ({ command, payload }) =>
      this.parser.handleCommand(command, payload),
    );

    this.parser.on("settings", (settingsData) => {
      let game = this.games.get(this.gameNumber);
      if (game === undefined || game === null || !game.settings) {
        // a new game has occurred, since no game with that specific game number exists (number increases every game)
        this.games.set(this.gameNumber, {
          settings: settingsData,
          gameEnded: false,
        });
        const newGameData = getStartGameData(settingsData);
        if (newGameData === undefined) return;
        const sameGame = isSameGame(newGameData, this.previousPlayers);

        const data: SlippiGameStartData = {
          isTeams: newGameData.isTeams,
          players: newGameData.players,
          isSameGame: sameGame,
        };

        this.browserWindow.webContents.send("slippi:new-game-start-data", data);
        this.previousPlayers = newGameData;
      }
    });

    this.parser.on("finalized-frame", (frame) => {
      this.lastFrame = frame;
      for (const player of Object.values(frame.players)) {
        if (player) {
          const damage = (player.pre.percent ?? 0) - (player.post.percent ?? 0);
          const playerNum = player.post.playerIndex ?? -999;
          // if stock transition, don't add damage (you need to find out how much damage was dealt every frame, by using post.percent - pre.percent)
          // e.g. pre: 200, post: 0, because of stock transition, don't add to damage
          if (damage > 0) {
            this.playerDamages.set(
              playerNum,
              (this.playerDamages.get(playerNum) ?? 0) + damage,
            );
          }
        }
      }
    });

    this.parser.on("end", (gameEnd) => {
      let game = this.games.get(this.gameNumber);
      if (
        game &&
        game.gameEnded === false &&
        game.settings?.isTeams !== undefined
      ) {
        if (isActualGame(gameEnd, this.lastFrame, this.playerDamages)) {
          const winnersIndices = getWinner(
            game.settings,
            this.lastFrame,
            gameEnd,
          );
          if (winnersIndices.length > 0) {
            const gameEndData: SlippiGameEndData = {
              isTeams: game.settings.isTeams,
              winners: winnersIndices,
            };
            this.browserWindow?.webContents.send(
              "slippi:new-game-end-data",
              gameEndData,
            );
          }
        }
        game.gameEnded = true;
        this.games.set(this.gameNumber, game);
      }
      this.clearPrevGame();
      this.gameNumber++;
    });
  }

  async stop() {
    this.connection.disconnect();
    this.clearPrevGame();
  }
}

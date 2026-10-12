import { SlippiRelay } from "./SlippiRelay.js";
import {
  Command,
  ConnectionStatus,
  ConsoleConnection,
  FrameEntryType,
  GameEndType,
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
  getSlippiGameKey,
  getStartGameData,
  getWinners,
  isActualGame,
} from "./helpers.js";
import { EventStream } from "../EventStream.js";

type CurrentSlippiConsoleGame = {
  settings: GameStartType;
  lastFrame?: FrameEntryType;
  allDamageDealt: number;
};

const CONNECTION_STATUSES: Record<
  ConnectionStatus,
  { status: string; message: string }
> = {
  [ConnectionStatus.CONNECTED]: {
    status: "connected",
    message: "Connected to",
  },
  [ConnectionStatus.DISCONNECTED]: {
    status: "disconnected",
    message: "Disconnected from",
  },
  [ConnectionStatus.RECONNECT_WAIT]: {
    status: "connecting",
    message: "Reconnecting to",
  },
  [ConnectionStatus.CONNECTING]: {
    status: "connecting",
    message: "Connecting to",
  },
};

export class SlippiConsoleRelay implements SlippiRelay {
  private ip: string;
  private port: number;
  private connection: ConsoleConnection;
  private parser: SlpParser;
  private stream: SlpStream;
  private currentGame?: CurrentSlippiConsoleGame;
  private previousGame: string;
  private unsubscribers: (() => void)[];
  private reconnecting: boolean;

  constructor(ip: string, port: number) {
    this.ip = ip;
    this.port = port;
    this.connection = new ConsoleConnection();
    this.parser = new SlpParser();
    this.stream = new SlpStream({ suppressErrors: true });
    this.previousGame = "";
    this.unsubscribers = [];
    this.reconnecting = false;
  }

  private sendToast(message: string) {
    EventStream.notify("toast", "Slippi Console Relay", message);
  }

  private sendStatus(status: string) {
    EventStream.notify("connection", "slippi-wii", status);
  }

  private sendGameStart(newGameData: SlippiGameData) {
    const currentGameKey = getSlippiGameKey(newGameData);

    const data: SlippiGameStartData = {
      isTeams: newGameData.isTeams,
      players: newGameData.players,
      isSameGame: currentGameKey === this.previousGame,
    };

    EventStream.notify("slippi-game-start", data);
    this.previousGame = currentGameKey;
  }

  private sendGameEnd(
    currentGameEnd: GameEndType,
    currentGame: CurrentSlippiConsoleGame,
  ) {
    if (
      isActualGame(currentGame.lastFrame?.frame, currentGame.allDamageDealt)
    ) {
      const winnersIndices = getWinners(
        currentGame.settings,
        currentGame.lastFrame,
        currentGameEnd,
      );
      if (winnersIndices.length > 0) {
        const gameEndData: SlippiGameEndData = {
          isTeams: currentGame.settings.isTeams ?? false,
          winners: winnersIndices,
        };
        EventStream.notify("slippi-game-end", gameEndData);
      }
    }
  }
  async start() {
    this.unsubscribers.push(
      // feeding wii data into the slpstream
      this.connection.on("data", (data) => this.stream.process(data)),

      this.connection.on("statusChange", (connectionStatus) => {
        if (connectionStatus === ConnectionStatus.CONNECTED) {
          this.reconnecting = false;
        }
        // avoids situation where a reconnection will produce multiple logs, every 10 seconds
        if (this.reconnecting) return;
        if (connectionStatus === ConnectionStatus.RECONNECT_WAIT) {
          this.reconnecting = true;
        }
        const { status, message } = CONNECTION_STATUSES[connectionStatus];
        this.sendToast(`${message} ${this.ip}:${this.port}`);
        this.sendStatus(status);
      }),
      this.connection.on("error", (err) => {
        console.error(err);
      }),

      // any sort of event triggered will be passed onto the parser for handling
      this.stream.on("slp-command", ({ command, payload }) => {
        try {
          if (command === Command.GAME_START) {
            this.parser.reset();
          }
          this.parser.handleCommand(command, payload);
        } catch (err) {
          console.error(err);
        }
      }),

      this.parser.on("settings", (settingsData) => {
        const newGameData = getStartGameData(settingsData);
        if (newGameData === undefined) {
          return;
        }
        this.sendGameStart(newGameData);
        this.currentGame = {
          settings: settingsData,
          allDamageDealt: 0,
          lastFrame: undefined,
        };
      }),

      this.parser.on("finalized-frame", (frame) => {
        if (!this.currentGame) return;
        this.currentGame.lastFrame = frame;
        for (const player of Object.values(frame.players)) {
          if (player !== undefined) {
            const damage =
              (player.post.percent ?? 0) - (player.pre.percent ?? 0);
            // if stock transition, don't add damage (you need to find out how much damage was dealt every frame, by using post.percent - pre.percent)
            // e.g. pre: 200, post: 0, because of stock transition, don't add to damage
            if (damage > 0) {
              this.currentGame.allDamageDealt += damage;
            }
          }
        }
      }),

      this.parser.on("end", (gameEnd) => {
        if (this.currentGame) {
          this.sendGameEnd(gameEnd, this.currentGame);
        }
        this.currentGame = undefined;
      }),
    );

    await this.connection.connect(this.ip, this.port, true);
  }

  async stop() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.connection.disconnect();
    this.sendStatus("disconnected");
    this.currentGame = undefined;
  }
}

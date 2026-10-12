import { Mutex } from "es-toolkit";
import { SlippiRelay } from "./SlippiRelay.js";
import { SlippiRelayConfig, SlippiRelayType } from "@app/common";
import { SlippiFolderRelay } from "./SlippiFolderRelay.js";
import { SlippiConsoleRelay } from "./SlippiConsoleRelay.js";

type RelayFactory = {
  [T in SlippiRelayType]: (config: SlippiRelayConfig<T>) => SlippiRelay;
};

const relayFactories: RelayFactory = {
  folder: (config) => new SlippiFolderRelay(config.listenPath),
  console: (config) => new SlippiConsoleRelay(config.ip, config.port),
  dolphin: (config) => new SlippiConsoleRelay(config.ip, config.port),
};
export class SlippiRelayHandler {
  private static relay: SlippiRelay | undefined;
  private static relayMutex = new Mutex();

  static async setup<T extends SlippiRelayType>(config: SlippiRelayConfig<T>) {
    await this.relayMutex.acquire();
    try {
      await this.relay?.stop();
      this.relay = relayFactories[config.type]?.(config);
      await this.relay?.start();
    } finally {
      this.relayMutex.release();
    }
  }

  static async stop() {
    await this.relayMutex.acquire();
    try {
      await this.relay?.stop();
      this.relay = undefined;
    } finally {
      this.relayMutex.release();
    }
  }
}

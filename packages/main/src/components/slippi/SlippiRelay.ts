export interface SlippiRelay {
  stop: () => Promise<void>;
  start: () => Promise<void>;
}

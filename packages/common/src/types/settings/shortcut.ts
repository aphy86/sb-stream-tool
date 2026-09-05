// https://stackoverflow.com/questions/33378904/can-i-check-a-type-against-a-union-type-in-typescript
export const ALL_ACTIONS = [
  "submit",
  "home",
  "score-up",
  "score-down",
  "obs-quick-reconnect",
  "obs-disconnect",
] as const;

export type Action = (typeof ALL_ACTIONS)[number];

export type ShortcutSettings = { action: Action; hotkey: string }[];

// https://stackoverflow.com/questions/33378904/can-i-check-a-type-against-a-union-type-in-typescript
export const ALL_ACTIONS = [
  "submit",
  "home",
  "score-up",
  "score-down",
  "reset-score-global",
  "obs-quick-reconnect",
  "obs-disconnect",
  "team-left-score-up",
  "team-right-score-up",
  "team-left-score-down",
  "team-right-score-down",
] as const;

export type Action = (typeof ALL_ACTIONS)[number];

export type ShortcutSettings = { action: Action; hotkey: string }[];

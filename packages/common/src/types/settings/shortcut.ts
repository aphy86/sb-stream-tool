// https://stackoverflow.com/questions/33378904/can-i-check-a-type-against-a-union-type-in-typescript
export const ALL_ACTIONS = [
  "submit",
  "home",
  "score-up-local",
  "score-down-local",
  "reset-all-scores",
  "obs-quick-reconnect",
  "obs-disconnect",
  "team-left-score-up",
  "team-right-score-up",
  "team-left-score-down",
  "team-right-score-down",
] as const;

export type Action = (typeof ALL_ACTIONS)[number];

export type ShortcutSettings = { action: Action; hotkey: string }[];

export const DEFAULT_SHORTCUTS: ShortcutSettings = [
  { action: "home", hotkey: "Escape" },
  { action: "submit", hotkey: "Enter" },
  { action: "score-up-local", hotkey: "ArrowUp" },
  { action: "score-down-local", hotkey: "ArrowDown" },
  { action: "obs-disconnect", hotkey: "Alt+1" },
  { action: "obs-quick-reconnect", hotkey: "Alt+2" },
  { action: "reset-all-scores", hotkey: "Control+s" },
  { action: "team-left-score-up", hotkey: "Alt+ArrowUp" },
  { action: "team-left-score-down", hotkey: "Alt+ArrowDown" },
  { action: "team-right-score-up", hotkey: "Control+ArrowUp" },
  { action: "team-right-score-down", hotkey: "Control+ArrowDown" },
];

export const GLOBAL_ACTIONS = [
  "obs-quick-reconnect",
  "obs-disconnect",
  "team-left-score-up",
  "team-left-score-down",
  "team-right-score-up",
  "team-right-score-down",
] as const satisfies Action[];

export type GlobalAction = (typeof GLOBAL_ACTIONS)[number];

export const isGlobalAction = (action: Action) =>
  (GLOBAL_ACTIONS as Action[]).includes(action);

export const isSafeGlobalHotkey = (hotkey: string) => {
  const keys = hotkey.split("+");
  return (
    keys.some((k) => ["Control", "Alt", "Meta", "Mod"].includes(k)) ||
    /^F([1-9]|1[0-9]|2[0-4])$/.test(keys[keys.length - 1])
  );
};

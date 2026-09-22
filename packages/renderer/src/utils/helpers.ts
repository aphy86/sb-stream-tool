/**
 * More general helper functions/lookups, potentially used by more than 1 component/function in different categories
 */

import { Action } from "@app/common";

export function clamp(value: number, max: number, min: number) {
  if (Number.isNaN(value)) {
    return NaN;
  }
  if (value > max) {
    return max;
  }
  if (value < min) {
    return min;
  }
  return value;
}

export const ActionToName: Record<Action, string> = {
  home: "Home",
  submit: "Submit to overlay",
  "score-up": "Increase team score by 1",
  "score-down": "Decrease team score by 1",
  "obs-quick-reconnect": "Quick Reconnect to OBS Websocket",
  "obs-disconnect": "Disconnect from OBS Websocket",
  "reset-score-global": "Reset both teams' scores",
  "team-left-score-up": "Increase left team's score by 1",
  "team-right-score-up": "Increase right team's score by 1",
  "team-left-score-down": "Decrease left team's score by 1",
  "team-right-score-down": "Decrease left team's score by 1",
};

export function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: unknown }).name === "AbortError")
  );
}

import { createContext } from "react";
import type { ThemeProviderState } from "../types/theme";
import { UseFieldArrayReturn } from "react-hook-form";
import { GameProfileProviderState } from "@renderer/types/GameProfile";
import { MeleeProfile } from "@renderer/game-profiles/melee";

export const PlayerFormFieldArrayContext = createContext<UseFieldArrayReturn[]>(
  [],
);

export const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

export const GameProfileProviderContext =
  createContext<GameProfileProviderState>(MeleeProfile);

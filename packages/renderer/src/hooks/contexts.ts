import { createContext } from "react";
import type { ThemeProviderState } from "../types/theme";
import { GameProfileProviderState } from "@renderer/types/GameProfile";
import { MeleeProfile } from "@renderer/game-profiles/melee";
import { createFormHookContexts } from "@tanstack/react-form";

export const { fieldContext, formContext } = createFormHookContexts();

export const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

export const GameProfileProviderContext =
  createContext<GameProfileProviderState>(MeleeProfile);

import { use } from "react";
import { GameProfileProviderContext } from "./contexts";

export function useGameProfile() {
  const context = use(GameProfileProviderContext);

  if (context === undefined)
    throw new Error("useGameProfile must be used within a GameProfileProvider");

  return context;
}

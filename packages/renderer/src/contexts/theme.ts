import { ThemeProviderState } from "@renderer/types/theme";
import { createContext } from "react";

export const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

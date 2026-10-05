import { EventSetsStore } from "@renderer/lib/EventSetsStore";
import { createContext } from "react";

export const EventSetsContext = createContext<EventSetsStore>(
  new EventSetsStore(),
);

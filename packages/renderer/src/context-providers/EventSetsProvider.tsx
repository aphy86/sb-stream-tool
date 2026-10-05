import { EventSetsContext } from "@renderer/contexts/event-sets";
import { EventSetsStore } from "@renderer/lib/EventSetsStore";
import { EventSetsProviderProps } from "@renderer/types/event-sets";
import { useState } from "react";

export function EventSetsProvider({
  children,
  eventSetsStore,
  ...props
}: EventSetsProviderProps) {
  const [eventSetsStorage] = useState(eventSetsStore ?? new EventSetsStore());

  return (
    <EventSetsContext {...props} value={eventSetsStorage}>
      {children}
    </EventSetsContext>
  );
}

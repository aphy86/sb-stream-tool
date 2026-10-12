import { Action, SlippiGameEndData, SlippiGameStartData } from "@app/common";

type EventStreamNotificationArgs = {
  toast: [message: string, description?: string];
  connection: [type: string, status: string];
  "slippi-game-start": [data: SlippiGameStartData];
  "slippi-game-end": [data: SlippiGameEndData];
  "global-shortcut": [action: Action];
};
export interface EventSink {
  update(...args: any[]): void;
}

export class EventStream {
  private static observers: Map<string, EventSink[]> = new Map();

  static attach(eventType: string, newObserver: EventSink): void {
    if (!this.observers.has(eventType)) {
      this.observers.set(eventType, []);
    }
    this.observers.get(eventType)?.push(newObserver);
  }

  static detach(observer: EventSink): void {
    for (const [event, observers] of this.observers.entries()) {
      const observerIndex = observers.indexOf(observer);
      if (observerIndex !== -1) {
        observers.splice(observerIndex, 1);
        console.log(
          `Detached an observer at index ${observerIndex} from event "${event}"`,
        );
        return;
      }
    }
    console.log(`No observer found`);
  }

  static notify<K extends keyof EventStreamNotificationArgs>(
    eventType: K,
    ...args: EventStreamNotificationArgs[K]
  ): void {
    const observers = this.observers.get(eventType);
    if (observers) {
      for (const observer of observers) {
        observer.update(...args);
      }
    }
  }
}

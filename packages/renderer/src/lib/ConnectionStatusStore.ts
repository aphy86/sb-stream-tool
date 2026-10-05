export class ConnectionStatusStore {
  private statuses: Map<string, string>;

  private listeners: Map<string, Set<() => void>>;

  constructor() {
    this.statuses = new Map();
    this.listeners = new Map();
  }

  private notify(key: string) {
    this.listeners.get(key)?.forEach((fn) => fn());
  }

  update(key: string, status: string) {
    if (this.statuses.get(key) === status) return;
    this.statuses.set(key, status);
    this.notify(key);
  }

  get(key: string) {
    return this.statuses.get(key) ?? "disconnected";
  }

  subscribe(key: string, fn: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)?.add(fn);
    return () => {
      this.listeners.get(key)?.delete(fn);
    };
  }
}

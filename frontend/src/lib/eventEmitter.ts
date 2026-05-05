export type EventListener<Payload> = (payload: Payload) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<EventListener<unknown>>>();

  on(eventName: string, listener: EventListener<unknown>) {
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);

    return {
      unsubscribe: () => {
        this.off(eventName, listener);
      },
    };
  }

  off(eventName: string, listener: EventListener<unknown>) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;

    listeners.delete(listener);

    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit(eventName: string, payload: unknown) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Event listener for "${eventName}" failed`, error);
      }
    }
  }

  clear(eventName?: string) {
    if (eventName) {
      this.listeners.delete(eventName);
      return;
    }

    this.listeners.clear();
  }
}

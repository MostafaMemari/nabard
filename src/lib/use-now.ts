import { useSyncExternalStore } from "react";

let current: Date | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<() => void>();

function tick() {
  current = new Date();
  for (const notify of subscribers) {
    notify();
  }
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  if (subscribers.size === 1) {
    current = new Date();
    intervalId = setInterval(tick, 1000);
  }
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      current = null;
    }
  };
}

function getSnapshot(): Date | null {
  return current;
}

function getServerSnapshot(): Date | null {
  return null;
}

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

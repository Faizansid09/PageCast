import { EventEmitter } from "events";
import { DEFAULT_ROUTE, getNextRoute, isValidRoute } from "./pageRegistry";

export interface ScreenState {
  id: string;
  name: string;
  activeRoute: string; // Default: "/screen/welcome"
  tickerMessage: string;
  autoRotate: boolean;
  rotateIntervalSec: number; // Default: 20
  isOnline: boolean;
  connectedAt: number;
  updatedAt: number;
}

interface GlobalStore {
  screens: Map<string, ScreenState>;
  rotateTimers: Map<string, NodeJS.Timeout>;
  emitter: EventEmitter;
}

const globalForSignage = globalThis as unknown as {
  __SIGNAGE_STORE__?: GlobalStore;
};

// Initialize container if missing
if (!globalForSignage.__SIGNAGE_STORE__) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(500);

  globalForSignage.__SIGNAGE_STORE__ = {
    screens: new Map<string, ScreenState>(),
    rotateTimers: new Map<string, NodeJS.Timeout>(),
    emitter,
  };
}

const store = globalForSignage.__SIGNAGE_STORE__;

// Guard each property against hot reloads where an older global store might exist
if (!store.screens || !(store.screens instanceof Map)) {
  store.screens = new Map<string, ScreenState>();
}
if (!store.rotateTimers || !(store.rotateTimers instanceof Map)) {
  store.rotateTimers = new Map<string, NodeJS.Timeout>();
}
if (!store.emitter || !(store.emitter instanceof EventEmitter)) {
  store.emitter = new EventEmitter();
  store.emitter.setMaxListeners(500);
}

function startScreenAutoRotate(screenId: string, intervalSec: number) {
  stopScreenAutoRotate(screenId);

  const timer = setInterval(() => {
    const screen = store.screens.get(screenId);
    if (!screen || !screen.isOnline) {
      stopScreenAutoRotate(screenId);
      return;
    }
    const next = getNextRoute(screen.activeRoute);
    screen.activeRoute = next;
    screen.updatedAt = Date.now();
    store.emitter.emit("screen-update", {
      target: screenId,
      state: { ...screen },
    });
    store.emitter.emit("roster-update", screenStore.getAllScreens());
  }, intervalSec * 1000);

  store.rotateTimers.set(screenId, timer);
}

function stopScreenAutoRotate(screenId: string) {
  if (!store.rotateTimers) {
    store.rotateTimers = new Map<string, NodeJS.Timeout>();
    return;
  }
  const existing = store.rotateTimers.get(screenId);
  if (existing) {
    clearInterval(existing);
    store.rotateTimers.delete(screenId);
  }
}

export const screenStore = {
  registerScreen(id: string, name?: string): ScreenState {
    const existing = store.screens.get(id);
    const now = Date.now();

    if (existing) {
      existing.isOnline = true;
      if (name && name.trim()) {
        existing.name = name.trim();
      }
      existing.updatedAt = now;

      if (existing.autoRotate) {
        startScreenAutoRotate(id, existing.rotateIntervalSec);
      }

      store.emitter.emit("screen-update", {
        target: id,
        state: { ...existing },
      });
      store.emitter.emit("roster-update", this.getAllScreens());
      return { ...existing };
    }

    const cleanName =
      (name && name.trim()) || `Screen-${id.slice(0, 4)}`;

    const newScreen: ScreenState = {
      id,
      name: cleanName,
      activeRoute: DEFAULT_ROUTE,
      tickerMessage: "",
      autoRotate: false,
      rotateIntervalSec: 20,
      isOnline: true,
      connectedAt: now,
      updatedAt: now,
    };

    store.screens.set(id, newScreen);
    store.emitter.emit("screen-update", {
      target: id,
      state: { ...newScreen },
    });
    store.emitter.emit("roster-update", this.getAllScreens());
    return { ...newScreen };
  },

  disconnectScreen(id: string): void {
    const screen = store.screens.get(id);
    if (screen) {
      screen.isOnline = false;
      screen.updatedAt = Date.now();
      stopScreenAutoRotate(id);
      store.emitter.emit("roster-update", this.getAllScreens());
    }
  },

  removeOfflineScreen(id: string): void {
    const screen = store.screens.get(id);
    if (screen && !screen.isOnline) {
      stopScreenAutoRotate(id);
      store.screens.delete(id);
      store.emitter.emit("roster-update", this.getAllScreens());
    }
  },

  getScreen(id: string): ScreenState | undefined {
    const s = store.screens.get(id);
    return s ? { ...s } : undefined;
  },

  getAllScreens(): ScreenState[] {
    return Array.from(store.screens.values()).sort(
      (a, b) => a.connectedAt - b.connectedAt
    );
  },

  updateScreenTarget(
    target: "ALL" | string,
    updater: (s: ScreenState) => void
  ): ScreenState[] | ScreenState | null {
    if (target === "ALL") {
      const updated: ScreenState[] = [];
      store.screens.forEach((screen) => {
        updater(screen);
        screen.updatedAt = Date.now();

        if (screen.autoRotate && screen.isOnline) {
          startScreenAutoRotate(screen.id, screen.rotateIntervalSec);
        } else {
          stopScreenAutoRotate(screen.id);
        }

        store.emitter.emit("screen-update", {
          target: screen.id,
          state: { ...screen },
        });
        updated.push({ ...screen });
      });

      store.emitter.emit("roster-update", this.getAllScreens());
      return updated;
    }

    const screen = store.screens.get(target);
    if (!screen) {
      return null;
    }

    updater(screen);
    screen.updatedAt = Date.now();

    if (screen.autoRotate && screen.isOnline) {
      startScreenAutoRotate(screen.id, screen.rotateIntervalSec);
    } else {
      stopScreenAutoRotate(screen.id);
    }

    store.emitter.emit("screen-update", {
      target: screen.id,
      state: { ...screen },
    });
    store.emitter.emit("roster-update", this.getAllScreens());
    return { ...screen };
  },

  switchRoute(target: "ALL" | string, route: string) {
    if (!isValidRoute(route)) {
      throw new Error(`Invalid route: ${route}`);
    }
    return this.updateScreenTarget(target, (s) => {
      s.activeRoute = route;
    });
  },

  setTicker(target: "ALL" | string, tickerMessage: string) {
    return this.updateScreenTarget(target, (s) => {
      s.tickerMessage = (tickerMessage || "").trim();
    });
  },

  setAutoRotate(
    target: "ALL" | string,
    autoRotate: boolean,
    rotateIntervalSec?: number
  ) {
    return this.updateScreenTarget(target, (s) => {
      s.autoRotate = autoRotate;
      if (typeof rotateIntervalSec === "number" && rotateIntervalSec >= 5) {
        s.rotateIntervalSec = rotateIntervalSec;
      }
    });
  },

  onScreenUpdate(
    listener: (data: { target: string; state: ScreenState }) => void
  ): () => void {
    store.emitter.on("screen-update", listener);
    return () => {
      store.emitter.off("screen-update", listener);
    };
  },

  onRosterUpdate(listener: (roster: ScreenState[]) => void): () => void {
    store.emitter.on("roster-update", listener);
    return () => {
      store.emitter.off("roster-update", listener);
    };
  },
};

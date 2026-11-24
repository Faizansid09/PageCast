"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Maximize,
  Minimize,
  LogOut,
  Radio,
  Wifi,
  WifiOff,
  Bell,
} from "lucide-react";
import type { ScreenState } from "@/lib/screenStore";

export default function ScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [screenId, setScreenId] = useState<string>("");
  const [screenName, setScreenName] = useState<string>("Display Screen");
  const [screenState, setScreenState] = useState<ScreenState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize persistent screenId and screenName from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("screen_id");
      if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `screen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        localStorage.setItem("screen_id", id);
      }
      setScreenId(id);

      let name = localStorage.getItem("screen_name");
      if (!name || !name.trim()) {
        name = `Screen-${id.slice(0, 4)}`;
        localStorage.setItem("screen_name", name);
      }
      setScreenName(name);
    }
  }, []);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Connect to SSE stream once screenId is known
  useEffect(() => {
    if (!screenId) return;

    let reconnectTimer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    function connectSSE() {
      if (isCancelled) return;
      setConnectionStatus("connecting");

      const encodedId = encodeURIComponent(screenId);
      const encodedName = encodeURIComponent(screenName);
      const url = `/api/stream?role=screen&screenId=${encodedId}&name=${encodedName}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isCancelled) {
          setConnectionStatus("connected");
        }
      };

      // Targeted screen event
      es.addEventListener("screen", (event) => {
        if (isCancelled) return;
        try {
          const data: ScreenState = JSON.parse(event.data);
          if (data && data.id === screenId) {
            setScreenState(data);
          }
        } catch (e) {
          console.error("Failed to parse SSE screen state:", e);
        }
      });

      // Backward compatibility event fallback
      es.addEventListener("state", (event) => {
        if (isCancelled) return;
        try {
          const data = JSON.parse(event.data);
          if (data && (!data.id || data.id === screenId)) {
            setScreenState(data);
          }
        } catch (e) {
          console.error("Failed to parse SSE state:", e);
        }
      });

      es.onerror = () => {
        if (isCancelled) return;
        setConnectionStatus("disconnected");
        es.close();

        // Automatic retry with backoff
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectSSE();
          }, 3000);
        }
      };
    }

    connectSSE();

    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [screenId, screenName]);

  // Synchronize route navigation whenever activeRoute changes
  useEffect(() => {
    if (screenState?.activeRoute && screenState.activeRoute !== pathname) {
      router.push(screenState.activeRoute);
    }
  }, [screenState?.activeRoute, pathname, router]);

  // Handle user activity to show/hide kiosk controls
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request failed:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <div
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      className="relative h-screen w-screen overflow-hidden bg-neutral-950 text-white select-none flex flex-col cursor-none hover:cursor-default"
    >
      {/* Main Display Viewport (16:9 targeted) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {children}
      </main>

      {/* Floating Kiosk Quick Controls (top-right, hidden until mouse movement) */}
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-3 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-full px-3.5 py-1.5 shadow-xl text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-neutral-300 font-medium tracking-wide">
            {screenName}
          </span>
          {screenId && (
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
              #{screenId.slice(0, 4)}
            </span>
          )}
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className="p-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition shadow-xl"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={handleLogout}
          title="Exit Screen Mode"
          className="p-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-full text-red-400 hover:text-red-300 hover:bg-red-950/40 transition shadow-xl"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle Connection Status (Bottom Left) */}
      <div className="fixed bottom-3 left-3 z-50 pointer-events-none">
        {connectionStatus === "connected" ? (
          <div
            title="Connected to Real-Time Controller"
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-20 hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-mono animate-pulse shadow-lg">
            {connectionStatus === "connecting" ? (
              <Wifi className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>
              {connectionStatus === "connecting"
                ? "Connecting Stream..."
                : "Reconnecting Signal..."}
            </span>
          </div>
        )}
      </div>

      {/* Live Broadcast Ticker Overlay (Bottom Bar) */}
      {screenState?.tickerMessage && screenState.tickerMessage.trim() !== "" && (
        <aside
          aria-label="Live Broadcast Announcement"
          className="relative z-40 w-full bg-neutral-950/95 border-t border-red-500/40 backdrop-blur-xl shadow-2xl flex items-center h-14 overflow-hidden"
        >
          {/* Live Flash Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-5 h-full font-bold uppercase tracking-wider text-xs md:text-sm shadow-md shrink-0 z-10">
            <Radio className="w-4 h-4 animate-pulse text-white" />
            <span>FLASH NEWS</span>
          </div>

          {/* Marquee Content */}
          <div className="relative flex-1 overflow-hidden h-full flex items-center px-4">
            <div className="animate-marquee font-medium text-neutral-100 tracking-wide text-sm md:text-base flex items-center gap-8">
              <span className="flex items-center gap-2 text-white">
                <Bell className="w-4 h-4 text-amber-400 inline" />
                {screenState.tickerMessage}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300 font-mono text-xs uppercase tracking-widest">
                OFFICIAL BROADCAST
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-200">
                {screenState.tickerMessage}
              </span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

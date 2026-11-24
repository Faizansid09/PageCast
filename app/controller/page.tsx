"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  RotateCw,
  RefreshCw,
  LogOut,
  ExternalLink,
  CheckCircle2,
  X,
  Radio,
  Tv,
} from "lucide-react";
import { PAGE_REGISTRY, PageDefinition, DEFAULT_ROUTE } from "@/lib/pageRegistry";
import type { ScreenState } from "@/lib/screenStore";

export default function ControllerPage() {
  const router = useRouter();

  // Screen Roster & Real-time State
  const [roster, setRoster] = useState<ScreenState[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<"ALL" | string>("ALL");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Controls
  const [tickerInput, setTickerInput] = useState<string>("");
  const [selectedInterval, setSelectedInterval] = useState<number>(20);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    function connectSSE() {
      if (isCancelled) return;
      setConnectionStatus("connecting");

      const es = new EventSource("/api/stream?role=controller&name=Controller+Console");
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isCancelled) {
          setConnectionStatus("connected");
        }
      };

      es.addEventListener("roster", (event) => {
        if (isCancelled) return;
        try {
          const screens: ScreenState[] = JSON.parse(event.data);
          setRoster(screens);
        } catch (e) {
          console.error("Error parsing controller SSE roster:", e);
        }
      });

      es.addEventListener("screens", (event) => {
        if (isCancelled) return;
        try {
          const screens: ScreenState[] = JSON.parse(event.data);
          setRoster(screens);
        } catch (e) {
          console.error("Error parsing controller SSE screens:", e);
        }
      });

      es.onerror = () => {
        if (isCancelled) return;
        setConnectionStatus("disconnected");
        es.close();

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
  }, []);

  // Determine currently focused screen
  const targetedScreen =
    selectedTarget !== "ALL"
      ? roster.find((s) => s.id === selectedTarget)
      : null;

  const currentActiveRoute =
    targetedScreen?.activeRoute ||
    (roster.length > 0 ? roster[0].activeRoute : DEFAULT_ROUTE);

  const currentAutoRotate = targetedScreen
    ? targetedScreen.autoRotate
    : roster.some((s) => s.autoRotate);

  const currentTickerMessage = targetedScreen
    ? targetedScreen.tickerMessage
    : (roster.find((s) => s.tickerMessage)?.tickerMessage || "");

  // Sync interval
  useEffect(() => {
    if (targetedScreen?.rotateIntervalSec) {
      setSelectedInterval(targetedScreen.rotateIntervalSec);
    }
  }, [targetedScreen]);

  const triggerFeedback = useCallback((msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 2500);
  }, []);

  const sendControlAction = async (action: string, payload: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: selectedTarget,
          action,
          ...payload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Action failed");
      }

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Command failed";
      alert(`Action error: ${message}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchRoute = async (route: string) => {
    const success = await sendControlAction("SWITCH_ROUTE", { route });
    if (success) {
      const targetLabel = targetedScreen ? targetedScreen.name : "All Displays";
      triggerFeedback(`Updated ${targetLabel} to ${route}`);
    }
  };

  const handleToggleAutoRotate = async () => {
    const newStatus = !currentAutoRotate;
    const success = await sendControlAction("SET_AUTO_ROTATE", {
      autoRotate: newStatus,
      rotateIntervalSec: selectedInterval,
    });
    if (success) {
      const targetLabel = targetedScreen ? targetedScreen.name : "All Displays";
      triggerFeedback(
        newStatus
          ? `Auto-rotate enabled for ${targetLabel} (${selectedInterval}s)`
          : `Auto-rotate disabled for ${targetLabel}`
      );
    }
  };

  const handleChangeInterval = async (interval: number) => {
    setSelectedInterval(interval);
    if (currentAutoRotate) {
      const success = await sendControlAction("SET_AUTO_ROTATE", {
        autoRotate: true,
        rotateIntervalSec: interval,
      });
      if (success) {
        triggerFeedback(`Interval set to ${interval}s`);
      }
    }
  };

  const handlePushTicker = async (text: string) => {
    if (!text.trim()) return;
    const success = await sendControlAction("SET_TICKER", {
      tickerMessage: text.trim(),
    });
    if (success) {
      setTickerInput("");
      const targetLabel = targetedScreen ? targetedScreen.name : "All Displays";
      triggerFeedback(`Announcement published to ${targetLabel}`);
    }
  };

  const handleClearTicker = async () => {
    const success = await sendControlAction("SET_TICKER", { tickerMessage: "" });
    if (success) {
      setTickerInput("");
      const targetLabel = targetedScreen ? targetedScreen.name : "All Displays";
      triggerFeedback(`Announcement cleared for ${targetLabel}`);
    }
  };

  const handleRemoveScreen = async (screenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: screenId,
          action: "REMOVE_SCREEN",
        }),
      });

      if (res.ok) {
        if (selectedTarget === screenId) {
          setSelectedTarget("ALL");
        }
        triggerFeedback("Offline screen removed");
      }
    } catch {
      alert("Failed to remove screen");
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

  const onlineCount = roster.filter((s) => s.isOnline).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Monitor className="w-4 h-4" />
            </div>
            <h1 className="font-semibold text-slate-900 text-sm tracking-tight">
              Signage Controller
            </h1>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1.5">
            {connectionStatus === "connected" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
              </span>
            )}
          </div>

          {/* Action Feedback Pill */}
          {actionFeedback && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{actionFeedback}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium tabular-nums hidden sm:inline">
            {onlineCount} of {roster.length} Displays Online
          </span>

          <a
            href="/screen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Open Screen</span>
          </a>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2-Column Clean Layout */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar (w-64) - Notion/Linear Minimal Pill Rows */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 shrink-0 flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Displays
            </h2>
            <span className="text-[11px] font-medium text-slate-400 tabular-nums">
              {roster.length}
            </span>
          </div>

          {/* All Displays Pill */}
          <button
            onClick={() => setSelectedTarget("ALL")}
            className={`w-full px-2.5 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
              selectedTarget === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tv className={`w-3.5 h-3.5 ${selectedTarget === "ALL" ? "text-white" : "text-slate-400"}`} />
              <span>All Displays</span>
            </div>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums ${
                selectedTarget === "ALL"
                  ? "bg-slate-800 text-emerald-400"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {onlineCount}
            </span>
          </button>

          {/* Section Divider */}
          <div className="my-2 border-t border-slate-100" />

          {/* Individual Screen Rows */}
          <div className="space-y-0.5">
            {roster.length === 0 ? (
              <div className="text-center py-6 px-2 text-slate-400 text-xs">
                No screens connected yet
              </div>
            ) : (
              roster.map((screen) => {
                const isSelected = selectedTarget === screen.id;
                const pageMeta = PAGE_REGISTRY.find(
                  (p) => p.route === screen.activeRoute
                );

                return (
                  <div
                    key={screen.id}
                    onClick={() => setSelectedTarget(screen.id)}
                    className={`w-full px-2.5 py-2 rounded-md cursor-pointer transition flex items-center justify-between text-xs group ${
                      isSelected
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          screen.isOnline ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs leading-snug">{screen.name}</p>
                        <p className="text-[10px] font-normal text-slate-400 truncate">
                          {pageMeta?.title || screen.activeRoute}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {screen.autoRotate && (
                        <span className="text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded">
                          Auto
                        </span>
                      )}
                      {!screen.isOnline && (
                        <button
                          onClick={(e) => handleRemoveScreen(screen.id, e)}
                          title="Remove offline screen"
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Spacious Main Area */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header: Selected Target Heading */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedTarget === "ALL" ? "All Displays" : targetedScreen?.name || selectedTarget}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedTarget === "ALL"
                  ? "Changes pushed below will update every connected display simultaneously."
                  : `Changes will only be reflected on "${targetedScreen?.name}".`}
              </p>
            </div>

            {/* Quick Controls Card (Auto-Rotate & Announcement Banner) */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auto-Rotate Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">
                      Auto-Rotate
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cycle through pages in sequence automatically.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={handleToggleAutoRotate}
                    disabled={isSubmitting}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      currentAutoRotate ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        currentAutoRotate ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Interval Pills */}
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Cycle Interval
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[10, 15, 20, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleChangeInterval(sec)}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          selectedInterval === sec
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Announcement Banner */}
              <div className="space-y-3 md:border-l md:border-slate-100 md:pl-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Announcement Banner
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Display a live ticker bar across the bottom of the screens.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePushTicker(tickerInput);
                    }}
                    placeholder="Enter announcement text..."
                    className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                  />
                  <button
                    onClick={() => handlePushTicker(tickerInput)}
                    disabled={isSubmitting || !tickerInput.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    Publish
                  </button>
                  <button
                    onClick={handleClearTicker}
                    disabled={isSubmitting || !currentTickerMessage}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>

                {currentTickerMessage && (
                  <p className="text-[11px] text-slate-500 truncate bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
                    <span className="font-semibold text-slate-700">Active Banner: </span>
                    {currentTickerMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Section: Pages Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Pages</h3>
                <span className="text-xs text-slate-400">Click any card to display</span>
              </div>

              {/* Compact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PAGE_REGISTRY.map((page: PageDefinition) => {
                  const isActive = page.route === currentActiveRoute;

                  return (
                    <div
                      key={page.id}
                      onClick={() => handleSwitchRoute(page.route)}
                      className={`bg-white border rounded-lg p-4 cursor-pointer transition shadow-xs flex items-center justify-between group ${
                        isActive
                          ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50/50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {page.title}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                          {page.route}
                        </p>
                      </div>

                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 bg-slate-200/80 px-2.5 py-1 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-md hover:bg-slate-50 transition shadow-2xs shrink-0"
                        >
                          Display
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

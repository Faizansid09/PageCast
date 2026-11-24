"use client";

import React, { useEffect, useState } from "react";
import {
  Layers,
  Clock,
  Maximize2,
  Tv,
  CheckCircle2,
  Eye,
  Sliders,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Code,
} from "lucide-react";

export default function SampleScreen() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [viewportDim, setViewportDim] = useState<string>("1920 × 1080");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);

    const updateDim = () => {
      setViewportDim(`${window.innerWidth} × ${window.innerHeight}`);
    };
    updateDim();
    window.addEventListener("resize", updateDim);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateDim);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-neutral-950 text-white flex flex-col justify-between p-8 md:p-12 overflow-hidden bg-grid-pattern select-none">
      {/* TV Safe Area Guidelines (Toggleable Visual Reference) */}
      {showGuides && (
        <div className="absolute inset-4 md:inset-8 border border-blue-500/25 pointer-events-none rounded-xl z-20 flex flex-col justify-between p-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-blue-400/80 px-2">
            <span>ACTION SAFE AREA (90%)</span>
            <span>TITLE SAFE AREA (80%)</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-blue-400/80 px-2">
            <span>16:9 VIEWPORT BOUNDARY</span>
            <span>BOTTOM TICKER CLEARANCE ZONE (56px)</span>
          </div>
        </div>
      )}

      {/* ZONE 1: SCREEN HEADER & BRAND ANCHOR */}
      <header className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded">
                ZONE 1: HEADER & IDENTITY ANCHOR
              </span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs font-mono text-neutral-400">10-15% Screen Height</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Screen Architecture & Design Anatomy
            </h1>
          </div>
        </div>

        {/* Live Telemetry & Toggle Guide Button */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition ${
              showGuides
                ? "bg-blue-950/80 border-blue-500/50 text-blue-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showGuides ? "Hide Safe Guides" : "Show Safe Guides"}</span>
          </button>

          <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3.5 py-1.5 rounded-xl font-mono text-xs">
            <Tv className="w-4 h-4 text-emerald-400" />
            <span className="text-neutral-400">Viewport:</span>
            <span className="text-white font-bold">{viewportDim}</span>
          </div>

          <div className="text-right">
            <div className="font-mono text-xl md:text-2xl font-black text-blue-400 leading-none">
              {currentTime || "12:00:00 PM"}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">
              {currentDate || "Tuesday, Nov 24, 2026"}
            </div>
          </div>
        </div>
      </header>

      {/* ZONE 2: PRIMARY CONTENT STAGE (THE 5 ESSENTIAL RULES) */}
      <section className="relative z-10 flex-1 my-5 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            ZONE 2: PRIMARY CONTENT STAGE (65-70% Height • Zero Scrollbars)
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            Best practices for 1080p / 4K Kiosks & TV Displays
          </span>
        </div>

        {/* 5 Essential Screen Building Rules Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: 16:9 Aspect Lock */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                16:9 Lock & Zero Scroll
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Lock the container to <code className="text-blue-300 font-mono">h-screen w-screen overflow-hidden</code>. Displays must never show browser scrollbars.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Full Bleed Responsive</span>
            </div>
          </div>

          {/* Card 2: 10-20 Foot Legibility */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                10-20ft Distance Scale
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Viewers stand meters away. Use bold typography: headlines 40-72px, body text minimum 16px, and ultra-high contrast (WCAG AAA).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Heavy Weights & Contrast</span>
            </div>
          </div>

          {/* Card 3: Safe Viewing Margins */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Safe Margins (Overscan)
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Commercial TVs often clip 5% of borders. Keep all text within the inner 90% boundary with generous padding (<code className="text-amber-300 font-mono">p-8 to p-14</code>).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Action & Title Safe</span>
            </div>
          </div>

          {/* Card 4: Ambient Motion */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-3">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Gentle Ambient Motion
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Avoid rapid flashing. Use subtle breathing glows (<code className="text-purple-300 font-mono">animate-pulse</code>) and linear marquee scrolls for high retention.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Zero Screen Burn-In</span>
            </div>
          </div>

          {/* Card 5: Ticker Clearance */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs mb-3">
                05
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Bottom Ticker Buffer
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Reserve 56px at bottom for live announcement banners. Ensure page elements never collide with the persistent broadcast ticker.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Reserved Overlay Slot</span>
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 3: FOOTER & LIVE TICKER CLEARANCE */}
      <footer className="relative z-10 border-t border-neutral-800 pt-4 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="font-mono text-blue-400 font-bold uppercase">
            ZONE 3: FOOTER & ANNOUNCEMENT BUFFER
          </span>
          <span className="text-neutral-600">•</span>
          <span>10-15% Height</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-300 font-medium">
            Persistent layout automatically renders ticker overlay without layout shifts.
          </span>
        </div>

        <div className="font-mono text-[11px] text-neutral-500">
          REGISTERED IN <code className="text-white">lib/pageRegistry.ts</code>
        </div>
      </footer>
    </div>
  );
}

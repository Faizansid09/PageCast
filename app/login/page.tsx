"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tv,
  Monitor,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("from");

  const [activeRole, setActiveRole] = useState<"screen" | "controller">("screen");
  const [passcode, setPasscode] = useState<string>("");
  const [screenName, setScreenName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passcode.trim()) {
      setErrorMsg("Please enter the passcode.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          passcode: passcode.trim(),
          name: activeRole === "screen" ? (screenName.trim() || undefined) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // If logging in as screen, ensure stable screen_id and store screen_name
      if (activeRole === "screen") {
        let existingId = localStorage.getItem("screen_id");
        if (!existingId) {
          existingId = crypto.randomUUID();
          localStorage.setItem("screen_id", existingId);
        }
        localStorage.setItem(
          "screen_name",
          screenName.trim() || `Screen-${existingId.slice(0, 4)}`
        );
      }

      const destination =
        redirectTarget ||
        data.redirectUrl ||
        (activeRole === "controller" ? "/controller" : "/screen");
      router.push(destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3">
          <Monitor className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Signage System Access
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select operating mode to connect to the digital signage platform.
        </p>
      </div>

      {/* Clean Mode Switcher Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg mb-6 gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveRole("screen");
            setErrorMsg(null);
          }}
          className={`py-2 px-3 rounded-md text-xs font-medium transition flex items-center justify-center gap-2 ${
            activeRole === "screen"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Screen Display</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveRole("controller");
            setErrorMsg(null);
          }}
          className={`py-2 px-3 rounded-md text-xs font-medium transition flex items-center justify-center gap-2 ${
            activeRole === "controller"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Controller</span>
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeRole === "screen" && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Screen Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder="e.g. Lobby TV, Conference Kiosk"
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {activeRole === "controller" ? "Controller Passcode" : "Screen Passcode"}
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode..."
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-md transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isLoading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Continue to {activeRole === "controller" ? "Controller" : "Display"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-6 antialiased select-none">
      <Suspense
        fallback={
          <div className="text-slate-400 text-xs">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

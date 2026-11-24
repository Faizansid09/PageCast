import { NextRequest } from "next/server";
import { screenStore, ScreenState } from "@/lib/screenStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "screen";
  const screenId = searchParams.get("screenId");
  const nameParam = searchParams.get("name");
  const screenName = nameParam ? decodeURIComponent(nameParam) : undefined;

  const encoder = new TextEncoder();
  let isClosed = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let unsubscribeScreen: (() => void) | null = null;
  let unsubscribeRoster: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      function safeEnqueue(data: string) {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          isClosed = true;
        }
      }

      // Role 1: Screen Client
      if (role === "screen") {
        if (!screenId) {
          safeEnqueue(
            `event: error\ndata: ${JSON.stringify({ error: "Missing required screenId" })}\n\n`
          );
          controller.close();
          return;
        }

        // Register or reconnect screen
        const initialState = screenStore.registerScreen(screenId, screenName);

        // Push current state immediately
        safeEnqueue(`event: screen\ndata: ${JSON.stringify(initialState)}\n\n`);
        // Also send "state" for backwards compatibility
        safeEnqueue(`event: state\ndata: ${JSON.stringify(initialState)}\n\n`);

        // Subscribe to targeted screen updates
        unsubscribeScreen = screenStore.onScreenUpdate(
          ({ target, state }: { target: string; state: ScreenState }) => {
            if (target === screenId || target === "ALL") {
              safeEnqueue(`event: screen\ndata: ${JSON.stringify(state)}\n\n`);
              safeEnqueue(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
            }
          }
        );
      } else {
        // Role 2: Controller Client
        // Immediately push current screen roster
        const initialRoster = screenStore.getAllScreens();
        safeEnqueue(`event: roster\ndata: ${JSON.stringify(initialRoster)}\n\n`);
        safeEnqueue(`event: screens\ndata: ${JSON.stringify(initialRoster)}\n\n`);

        // Subscribe to roster updates
        unsubscribeRoster = screenStore.onRosterUpdate((roster: ScreenState[]) => {
          safeEnqueue(`event: roster\ndata: ${JSON.stringify(roster)}\n\n`);
          safeEnqueue(`event: screens\ndata: ${JSON.stringify(roster)}\n\n`);
        });
      }

      // 20-second keep-alive heartbeat comment
      heartbeatTimer = setInterval(() => {
        safeEnqueue(`: heartbeat\n\n`);
      }, 20000);

      function cleanup() {
        if (isClosed) return;
        isClosed = true;

        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        if (unsubscribeScreen) {
          unsubscribeScreen();
          unsubscribeScreen = null;
        }

        if (unsubscribeRoster) {
          unsubscribeRoster();
          unsubscribeRoster = null;
        }

        if (role === "screen" && screenId) {
          screenStore.disconnectScreen(screenId);
        }

        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      }

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      isClosed = true;
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (unsubscribeScreen) unsubscribeScreen();
      if (unsubscribeRoster) unsubscribeRoster();
      if (role === "screen" && screenId) {
        screenStore.disconnectScreen(screenId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

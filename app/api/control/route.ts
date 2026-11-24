import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";
import { screenStore } from "@/lib/screenStore";
import { isValidRoute } from "@/lib/pageRegistry";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify controller session
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySession(token);

    if (!session || session.role !== "controller") {
      return NextResponse.json(
        { error: "Unauthorized: Controller privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action;
    const target = (body.target && typeof body.target === "string") ? body.target : "ALL";

    // Flatten parameters from either top-level or payload object
    const route = body.route || body.payload?.route;
    const tickerMessage = body.tickerMessage !== undefined ? body.tickerMessage : body.payload?.tickerMessage;
    const autoRotate = body.autoRotate !== undefined ? body.autoRotate : body.payload?.autoRotate;
    const rotateIntervalSec = body.rotateIntervalSec !== undefined ? body.rotateIntervalSec : body.payload?.rotateIntervalSec;

    // 2. If targeting a specific screen, ensure it exists in the store
    if (target !== "ALL") {
      const existing = screenStore.getScreen(target);
      if (!existing) {
        return NextResponse.json(
          { error: `Screen not found: ${target}` },
          { status: 404 }
        );
      }
    }

    // 3. Handle actions
    switch (action) {
      case "SWITCH_ROUTE": {
        if (!route || typeof route !== "string" || !isValidRoute(route)) {
          return NextResponse.json(
            { error: `Invalid or unregistered route: ${route}` },
            { status: 400 }
          );
        }
        const result = screenStore.switchRoute(target, route);
        return NextResponse.json({ success: true, target, result });
      }

      case "SET_TICKER": {
        const msg = typeof tickerMessage === "string" ? tickerMessage : "";
        const result = screenStore.setTicker(target, msg);
        return NextResponse.json({ success: true, target, result });
      }

      case "SET_AUTO_ROTATE": {
        const result = screenStore.setAutoRotate(
          target,
          Boolean(autoRotate),
          typeof rotateIntervalSec === "number" ? rotateIntervalSec : undefined
        );
        return NextResponse.json({ success: true, target, result });
      }

      case "REMOVE_SCREEN": {
        if (target === "ALL") {
          return NextResponse.json(
            { error: "Cannot remove ALL screens. Specify an offline screenId." },
            { status: 400 }
          );
        }
        screenStore.removeOfflineScreen(target);
        return NextResponse.json({
          success: true,
          message: `Screen ${target} removed if offline.`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown control action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Control API error:", error);
    return NextResponse.json(
      { error: "Internal server error during control command execution" },
      { status: 500 }
    );
  }
}

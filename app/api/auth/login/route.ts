import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  signSession,
  validatePasscode,
  SessionRole,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, passcode, name } = body;

    if (role !== "controller" && role !== "screen") {
      return NextResponse.json(
        { error: "Invalid role specified. Must be 'controller' or 'screen'." },
        { status: 400 }
      );
    }

    if (!validatePasscode(role as SessionRole, passcode)) {
      return NextResponse.json(
        { error: "Invalid passcode. Please verify your credentials." },
        { status: 401 }
      );
    }

    const displayName =
      (typeof name === "string" && name.trim()) ||
      (role === "controller" ? "Controller HQ" : "Display Screen");

    const token = await signSession({
      role: role as SessionRole,
      name: displayName,
    });

    const redirectUrl = role === "controller" ? "/controller" : "/screen";

    const response = NextResponse.json({
      success: true,
      role,
      name: displayName,
      redirectUrl,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      SESSION_COOKIE_OPTIONS
    );

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}

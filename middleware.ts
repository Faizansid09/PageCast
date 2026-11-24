import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  // Protect /api/control: strictly requires controller role
  if (pathname.startsWith("/api/control")) {
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Missing session" },
        { status: 401 }
      );
    }
    if (session.role !== "controller") {
      return NextResponse.json(
        { error: "Forbidden: Controller access required" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Handle Root (/): Initially open the login page
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Handle /login: if already logged in, redirect to respective dashboard
  if (pathname === "/login") {
    if (session?.role === "controller") {
      return NextResponse.redirect(new URL("/controller", req.url));
    }
    if (session?.role === "screen") {
      return NextResponse.redirect(new URL("/screen", req.url));
    }
    return NextResponse.next();
  }

  // Protect /controller: strictly requires controller role
  if (pathname.startsWith("/controller")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "controller") {
      // Screen users are redirected to /screen
      return NextResponse.redirect(new URL("/screen", req.url));
    }
    return NextResponse.next();
  }

  // Protect /screen/*: requires either screen or controller role
  if (pathname.startsWith("/screen")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Controller and screen roles are both permitted
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/controller/:path*",
    "/screen/:path*",
    "/api/control/:path*",
    "/api/control",
  ],
};

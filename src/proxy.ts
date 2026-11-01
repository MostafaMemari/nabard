import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, type SessionRole, verifySessionToken } from "@/lib/session";

const roleHome: Record<SessionRole, string> = { ADMIN: "/admin", COACH: "/coach" };

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const home = roleHome[user.role];
  const pathname = request.nextUrl.pathname;
  const onOwnSection = pathname === home || pathname.startsWith(`${home}/`);
  if (!onOwnSection) return NextResponse.redirect(new URL(home, request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/coach/:path*"],
};

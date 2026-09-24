import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (token?.role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, message: "Forbidden: Admin privileges required." },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    try {
      await updateSession(req);
    } catch {
      // Supabase session refresh non-blocking
    }

    return NextResponse.next();
  },
  {
     secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
          return token?.role === "ADMIN";
        }
        if (pathname.startsWith("/account")) {
          return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};

import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token        = req.nextauth.token;
    const role         = token?.role as string | undefined;

    // ── Already authenticated → skip /login ─────────────────────────────────
    if (pathname === "/login") {
      if (token) {
        const dest =
          role === "ADMIN" ? "/dashboard/admin"  :
          role === "STAFF" ? "/dashboard/staff"  :
          role === "BUYER" ? "/dashboard/buyer"  :
                             "/dashboard/admin";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      return NextResponse.next();
    }

    // ── /dashboard (bare) → role-split redirect ──────────────────────────────
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      const dest =
        role === "ADMIN" ? "/dashboard/admin"  :
        role === "STAFF" ? "/dashboard/staff"  :
        role === "BUYER" ? "/dashboard/buyer"  :
                           "/login";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // ── /dashboard/admin/** → ADMIN only ─────────────────────────────────────
    if (pathname.startsWith("/dashboard/admin")) {
      if (role !== "ADMIN") {
        const dest =
          role === "STAFF" ? "/dashboard/staff" :
          role === "BUYER" ? "/dashboard/buyer" :
                             "/login";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      return NextResponse.next();
    }

    // ── /dashboard/staff/** → STAFF or ADMIN ─────────────────────────────────
    if (pathname.startsWith("/dashboard/staff")) {
      if (role !== "STAFF" && role !== "ADMIN") {
        return NextResponse.redirect(new URL(
          role === "BUYER" ? "/dashboard/buyer" : "/login",
          req.url
        ));
      }
      return NextResponse.next();
    }

    // ── /dashboard/buyer/** → BUYER, STAFF or ADMIN ──────────────────────────
    if (pathname.startsWith("/dashboard/buyer")) {
      if (!role) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // All authenticated roles can view buyer pages
      return NextResponse.next();
    }

    // ── Catch-all dashboard ───────────────────────────────────────────────────
    if (pathname.startsWith("/dashboard")) {
      if (!role) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        // Public routes
        if (pathname === "/login" || pathname === "/") return true;
        // All dashboard routes require a token
        return !!token;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|uploads).*)",
  ],
};
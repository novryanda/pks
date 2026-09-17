import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/rate-limiter";

// Define token type to match JWT from auth config
interface Token {
  id: string;
  name?: string | null;
  picture?: string | null;
  role?: {
    id: string;
    name: string;
    description?: string | null;
  };
  company?: {
    id: string;
    code: string;
    name: string;
  };
}

// Define public routes that don't require authentication
const publicRoutes = ["/", "/auth", "/unauthorized"];

// Helper: check if path is a public asset in /public (e.g. /logopt.png, /logo.svg, etc)
function isPublicAsset(pathname: string) {
  // Only match root-level files (not /public/subfolder/file.png)
  // If you want to allow all /public/**, use: return !pathname.includes("/") || pathname.split("/").length === 2;
  // But Next.js serves /public/* as /*
  // Allow all files at root (e.g. /file.png, /logo.svg)
  return /^\/[\w.-]+\.(png|jpg|jpeg|gif|svg|ico|webp|txt|json|xml|pdf)$/i.test(pathname);
}

// Define protected routes - any authenticated user with a role can access their company dashboard
// Permission checking is done at the page/API level using RBAC
const protectedRoutes = [
  "/dashboard/pt-pks",
  "/dashboard/pt-htk",
  "/dashboard/pt-nilo",
  "/dashboard/pt-zta",
];

// API routes that require specific roles
// Note: These are checked by middleware AND in the route handler for double protection
const protectedApiRoutes: Record<string, string[]> = {
  "/api/admin": ["Admin"],
};

// Rate limited routes and their configs
const rateLimitedRoutes: Record<string, { limit: number; windowMs: number }> = {
  "/api/pt-pks/tbs-statistics": { limit: 15, windowMs: 60000 },
  "/api/pt-pks/stock-product/summary": { limit: 15, windowMs: 60000 },
  "/api/pt-pks/stock-product/history": { limit: 15, windowMs: 60000 },
  "/api/pt-pks/pengiriman-product/summary": { limit: 15, windowMs: 60000 },
  "/api/pt-pks/proses-produksi/summary": { limit: 15, windowMs: 60000 },
  "/api/pt-pks/proses-produksi": { limit: 15, windowMs: 60000 },
};

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get token from JWT
  // Cookie name must match the custom name in auth/config.ts
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  }) as Token | null;

  const isLoggedIn = !!token;
  const isPublicRoute = publicRoutes.includes(pathname) || isPublicAsset(pathname);
  const isApiRoute = pathname.startsWith("/api");

  // Handle API routes
  if (isApiRoute) {
    // Allow NextAuth API routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Apply Rate Limiting
    const rateLimitRoute = Object.keys(rateLimitedRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (rateLimitRoute) {
      const config = rateLimitedRoutes[rateLimitRoute]!;
      const ip = req.headers.get("x-forwarded-for") || "anonymous";
      const key = `ratelimit:${pathname}:${ip}`;

      const result = rateLimit(key, config);

      if (!result.success) {
        return NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Maksimal 10 request per menit. Silakan tunggu sebentar."
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": config.limit.toString(),
              "X-RateLimit-Remaining": result.remaining.toString(),
              "X-RateLimit-Reset": result.reset.toString(),
            }
          }
        );
      }
    }

    // Check if API route requires authentication
    const protectedApiRoute = Object.keys(protectedApiRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (protectedApiRoute) {
      // Redirect to login if not authenticated
      if (!isLoggedIn) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check if user has required role for this API route
      const requiredRoles = protectedApiRoutes[protectedApiRoute];
      const userRole = token?.role?.name;

      if (!userRole || !requiredRoles || !requiredRoles.includes(userRole)) {
        return NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // Handle dashboard redirect from root /dashboard
  if (pathname === "/dashboard") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth", nextUrl));
    }

    const companyCode = token?.company?.code;
    if (companyCode) {
      return NextResponse.redirect(
        new URL(`/dashboard/${companyCode.toLowerCase()}`, nextUrl)
      );
    }

    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  // Handle public routes
  if (isPublicRoute) {
    // Jika user sudah login dan akses halaman public (/, /auth, /unauthorized), redirect ke dashboard perusahaan
    if (isLoggedIn) {
      const companyCode = token?.company?.code;
      if (companyCode) {
        return NextResponse.redirect(
          new URL(`/dashboard/${companyCode.toLowerCase()}`, nextUrl)
        );
      }
    }
    return NextResponse.next();
  }

  // Handle protected routes
  const protectedRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has a role assigned (any role is valid, permissions are checked at page/API level)
    const userRole = token?.role?.name;
    if (!userRole) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Check if user has access to the company
    const companyCode = token?.company?.code;
    const routeCompany = protectedRoute.replace("/dashboard/", "").toUpperCase();

    // Only allow users to access their own company dashboard
    if (companyCode !== routeCompany) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // All checks passed, allow access
    // Note: Page-level permission checking is done via RBAC in individual pages/APIs
    return NextResponse.next();
  }

  // For any other route, check if user is logged in
  // If not logged in and trying to access non-public route, redirect to auth
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

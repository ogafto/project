import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Extract host header safely (handling proxies / x-forwarded-host)
  const hostHeader =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.hostname ||
    "";

  // Take first host if comma-separated, strip port numbers, convert to lowercase
  const hostname = hostHeader
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();

  // Skip static files, _next internal assets, api routes, and files with extensions
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Root domain configuration with fallback
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl")
    .toLowerCase()
    .trim();

  // Environment & host checks
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");

  const isVercel =
    hostname.endsWith(".vercel.app") || hostname === "vercel.app";

  // Identify root domain (iskral.pl, www.iskral.pl, localhost, vercel preview)
  const isRootDomain =
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === "iskral.pl" ||
    hostname === "www.iskral.pl" ||
    hostname === "motywo.pl" ||
    hostname === "www.motywo.pl" ||
    isLocalhost ||
    isVercel;

  // 1. Root domain / www / localhost / vercel -> Pass directly to Next.js routing (app/page.tsx)
  if (isRootDomain) {
    return NextResponse.next();
  }

  // 2. Platform App Subdomain (app.iskral.pl)
  if (
    hostname === `app.${rootDomain}` ||
    hostname === "app.iskral.pl" ||
    hostname === "app.motywo.pl" ||
    hostname === "app"
  ) {
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. Platform Admin Subdomain (admin.iskral.pl)
  if (
    hostname === `admin.${rootDomain}` ||
    hostname === "admin.iskral.pl" ||
    hostname === "admin.motywo.pl" ||
    hostname === "admin"
  ) {
    if (url.pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 4. Extract store subdomain for *.iskral.pl or custom domains
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, "");
  } else if (hostname.endsWith(".iskral.pl")) {
    subdomain = hostname.replace(".iskral.pl", "");
  } else if (hostname.endsWith(".motywo.pl")) {
    subdomain = hostname.replace(".motywo.pl", "");
  } else if (
    !hostname.includes(rootDomain) &&
    !hostname.includes("iskral.pl") &&
    !hostname.includes("motywo.pl") &&
    !isLocalhost &&
    !isVercel
  ) {
    // Custom domain scenario (e.g. twojamarka.pl)
    subdomain = hostname;
  }

  // Rewrite to /site/[subdomain] for valid store subdomains
  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "app" &&
    subdomain !== "admin"
  ) {
    if (!url.pathname.startsWith("/site/")) {
      url.pathname = `/site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

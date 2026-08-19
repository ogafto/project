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

  // Root domain configuration with fallback to iskral.pl
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

  // 1. If request is to root domain or www:
  if (isRootDomain) {
    // If user accesses /site/[subdomain] directly on the main domain, redirect to https://[subdomain].iskral.pl
    if (url.pathname.startsWith("/site/")) {
      const parts = url.pathname.split("/").filter(Boolean); // ['site', 'subdomain', ...]
      if (parts.length >= 2) {
        const targetSubdomain = parts[1];
        const restPath = parts.slice(2).join("/");
        const port = req.nextUrl.port ? `:${req.nextUrl.port}` : "";
        const protocol = req.headers.get("x-forwarded-proto") || "https";

        if (isLocalhost) {
          const redirectUrl = `http://${targetSubdomain}.localhost${port}/${restPath}`;
          return NextResponse.redirect(redirectUrl, 301);
        }

        const redirectUrl = `${protocol}://${targetSubdomain}.${rootDomain}/${restPath}`;
        return NextResponse.redirect(redirectUrl, 301);
      }
    }

    // Direct access to main domain -> serve Landing Page & Dashboard (app/page.tsx, app/dashboard/...)
    return NextResponse.next();
  }

  // 2. Platform App Subdomain (app.iskral.pl)
  if (
    hostname === `app.${rootDomain}` ||
    hostname === "app.iskral.pl" ||
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
    hostname === "admin"
  ) {
    if (url.pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 4. Extract store subdomain for *.iskral.pl or custom domain
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, "");
  } else if (hostname.endsWith(".iskral.pl")) {
    subdomain = hostname.replace(".iskral.pl", "");
  } else if (
    !hostname.includes(rootDomain) &&
    !hostname.includes("iskral.pl") &&
    !isLocalhost &&
    !isVercel
  ) {
    // Custom domain scenario (e.g. twojamarka.pl)
    subdomain = hostname;
  }

  // For store subdomains (e.g. gigant.iskral.pl), ONLY use NextResponse.rewrite()
  // URL in browser stays https://gigant.iskral.pl while Next.js internally rewrites to /site/gigant
  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "iskral.pl" &&
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

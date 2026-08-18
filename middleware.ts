import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  // Skip static files, _next, api routes, icons
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "motywo.pl";

  // Normalize hostname (strip port numbers if running locally)
  const currentHost = hostname
    .replace(/:\d+$/, "")
    .replace(".localhost", "");

  // Check if request is to root domain, localhost, or Vercel preview/deployment domain (*.vercel.app)
  const isVercel = currentHost.endsWith(".vercel.app") || currentHost === "vercel.app";
  const isLocalhost = currentHost === "localhost" || currentHost === "127.0.0.1";
  const isRootDomain =
    currentHost === rootDomain ||
    currentHost === `www.${rootDomain}` ||
    isLocalhost ||
    isVercel;

  // 1. Root Domain / Vercel / Localhost
  if (isRootDomain) {
    return NextResponse.next();
  }

  // 2. App Subdomain (app.motywo.pl)
  if (currentHost === `app.${rootDomain}` || currentHost === "app") {
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. Admin Subdomain (admin.motywo.pl)
  if (currentHost === `admin.${rootDomain}` || currentHost === "admin") {
    if (url.pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 4. Store Subdomain (*.motywo.pl) or Custom Domain (twojamarka.pl)
  let subdomain: string | null = null;

  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else if (
    !currentHost.includes(rootDomain) &&
    !isLocalhost &&
    !isVercel
  ) {
    // Custom domain scenario (e.g. twojamarka.pl)
    subdomain = currentHost;
  }

  if (subdomain && subdomain !== "www" && subdomain !== "app" && subdomain !== "admin") {
    // Rewrite path to /site/[subdomain]
    url.pathname = `/site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

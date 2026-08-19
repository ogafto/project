import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  // Normalize host (strip port number e.g. "iskral.pl:3000" -> "iskral.pl")
  const currentHost = rawHost.split(":")[0].toLowerCase().trim();

  // Skip static files, _next internal assets, api routes, and files with extensions
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Root domain config with fallback
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl")
    .toLowerCase()
    .trim();

  // Environment checks
  const isLocalhost =
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost.endsWith(".localhost");
  const isVercel =
    currentHost.endsWith(".vercel.app") || currentHost === "vercel.app";

  // Check if request is directed to the main platform domain (or localhost / vercel preview)
  const isRootDomain =
    currentHost === rootDomain ||
    currentHost === `www.${rootDomain}` ||
    currentHost === "iskral.pl" ||
    currentHost === "www.iskral.pl" ||
    isLocalhost ||
    isVercel;

  // 1. Main Domain / www / Localhost / Vercel -> Pass directly to Next.js routing (Landing page app/page.tsx)
  if (isRootDomain) {
    return NextResponse.next();
  }

  // 2. Platform App Subdomain (e.g. app.iskral.pl)
  if (
    currentHost === `app.${rootDomain}` ||
    currentHost === "app.iskral.pl" ||
    currentHost === "app"
  ) {
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. Platform Admin Subdomain (e.g. admin.iskral.pl)
  if (
    currentHost === `admin.${rootDomain}` ||
    currentHost === "admin.iskral.pl" ||
    currentHost === "admin"
  ) {
    if (url.pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 4. Custom Store Subdomain (e.g. storename.iskral.pl) or Custom Domain (e.g. twojamarka.pl)
  let subdomain: string | null = null;

  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else if (currentHost.endsWith(".iskral.pl")) {
    subdomain = currentHost.replace(".iskral.pl", "");
  } else if (
    !currentHost.includes(rootDomain) &&
    !currentHost.includes("iskral.pl") &&
    !isLocalhost &&
    !isVercel
  ) {
    // Custom domain scenario (e.g. twojamarka.pl)
    subdomain = currentHost;
  }

  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "app" &&
    subdomain !== "admin"
  ) {
    // Avoid double rewriting if path already starts with /site/
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

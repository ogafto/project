import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();

  // Strip port numbers (:3000, :8080 etc) and trim lowercase
  const currentHost = hostname.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  const subdomain = currentHost.replace(`.${rootDomain}`, "").replace(".iskral.pl", "");

  // Main root domain, www, or direct localhost access
  if (
    currentHost === rootDomain ||
    currentHost === `www.${rootDomain}` ||
    currentHost === "iskral.pl" ||
    currentHost === "www.iskral.pl" ||
    subdomain === "www" ||
    currentHost === "localhost" ||
    currentHost === "127.0.0.1"
  ) {
    return NextResponse.next();
  }

  // App or Admin subdomain helpers
  if (subdomain === "app") {
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (subdomain === "admin") {
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Localhost subdomain support (e.g. afto.localhost)
  if (currentHost.endsWith(".localhost")) {
    const localSub = currentHost.replace(".localhost", "");
    if (localSub && localSub !== "www") {
      return NextResponse.rewrite(new URL(`/site/${localSub}${url.pathname === "/" ? "" : url.pathname}`, req.url));
    }
    return NextResponse.next();
  }

  // Rewrite all tenant subdomains (e.g. afto.iskral.pl -> /site/afto)
  if (subdomain && subdomain !== rootDomain && !subdomain.includes(".")) {
    return NextResponse.rewrite(new URL(`/site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`, req.url));
  }

  return NextResponse.next();
}

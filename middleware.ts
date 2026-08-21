import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _static (static files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - all static files with file extensions (e.g. .svg, .png, .jpg, .jpeg, .gif, .webp, .mp4, .css, .js)
     */
    "/((?!api/|_next/static|_next/image|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 1. Wyklucz z routingu pliki statyczne, favicony, _next, _static oraz endpointy /api
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_static") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Przechwyć nagłówek host z przychodzącego NextRequest
  const hostname = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();

  // Strip port numbers (:3000, :8080 etc) and trim lowercase
  const currentHost = hostname.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();

  // 3. Wykryj subdomenę
  let subdomain: string | null = null;

  if (currentHost.endsWith(".localhost")) {
    subdomain = currentHost.replace(".localhost", "");
  } else if (rootDomain && currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else if (currentHost.endsWith(".iskral.pl")) {
    subdomain = currentHost.replace(".iskral.pl", "");
  }

  // Ignoruj 'www' jako subdomenę sklepu
  if (subdomain === "www" || subdomain === "") {
    subdomain = null;
  }

  // 4. Obsługa domen głównych (twojadomena.pl, www.twojadomena.pl, localhost:3000, 127.0.0.1, vercel.app)
  if (
    !subdomain ||
    currentHost === rootDomain ||
    currentHost === `www.${rootDomain}` ||
    currentHost === "iskral.pl" ||
    currentHost === "www.iskral.pl" ||
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost.endsWith(".vercel.app")
  ) {
    return NextResponse.next();
  }

  // 5. Pomocnicze subdomeny systemowe: app -> /dashboard, admin -> /admin
  if (subdomain === "app") {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (subdomain === "admin") {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // 6. Wewnętrzny rewrite dla subdomen sklepów (np. drop.twojadomena.pl lub drop.localhost:3000)
  // Przekierowuje zapytanie do app/[subdomain]
  const rewritePath = `/${subdomain}${pathname === "/" ? "" : pathname}${url.search}`;
  return NextResponse.rewrite(new URL(rewritePath, req.url));
}

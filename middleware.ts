import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _static (static files)
     * - _vercel (Vercel deployment files)
     * - favicon.ico, sitemap.xml, robots.txt, placeholders
     */
    "/((?!api/|_next/static|_next/image|_static|_vercel|favicon.ico|robots.txt|sitemap.xml|placeholders/).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 1. Pomiń zasoby statyczne i API
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_static") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/placeholders") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Pobierz nazwę hosta (uwzględniając x-forwarded-host z Vercel/proxy)
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const hostname = rawHost.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();

  // 3. Wykryj subdomenę
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, "");
  } else if (hostname.endsWith(".iskral.pl")) {
    subdomain = hostname.replace(".iskral.pl", "");
  } else if (hostname.endsWith(".localhost")) {
    subdomain = hostname.replace(".localhost", "");
  }

  // Ignoruj 'www' oraz puste ciągi
  if (subdomain === "www" || subdomain === "") {
    subdomain = null;
  }

  // 4. Jeśli brak subdomeny lub domena główna / localhost / vercel preview
  if (
    !subdomain ||
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === "iskral.pl" ||
    hostname === "www.iskral.pl" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  ) {
    return NextResponse.next();
  }

  // 5. Specjalne subdomeny systemowe
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

  // 6. Zabezpieczenie przed podwójnym rewrite (np. /metek -> /metek/metek)
  if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
    return NextResponse.next();
  }

  // 7. Przepisz na stronę subdomeny /[subdomain]
  const rewritePath = `/${subdomain}${pathname === "/" ? "" : pathname}${url.search}`;
  return NextResponse.rewrite(new URL(rewritePath, req.url));
}

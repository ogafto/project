export interface CookieOptions {
  days?: number;
  domain?: string;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

/**
 * Dynamically resolves cookie domain based on current host
 * On iskral.pl / *.iskral.pl -> returns '.iskral.pl' for cross-subdomain sharing
 * On localhost, mobile direct IPs, Vercel previews -> returns undefined to prevent browser rejection
 */
export function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith(".iskral.pl") || hostname === "iskral.pl") {
    return ".iskral.pl";
  }
  return undefined;
}

export const AUTH_COOKIE_DOMAIN = getCookieDomain();

/**
 * Helper to get the canonical store URL (e.g. https://gigant.iskral.pl or http://gigant.localhost:3000)
 */
export function getStoreUrl(subdomain: string, customDomain?: string): string {
  if (customDomain && customDomain.trim()) {
    const cleanCustom = customDomain.trim();
    return cleanCustom.startsWith("http") ? cleanCustom : `https://${cleanCustom}`;
  }

  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();
  const cleanSub = (subdomain || "sklep").toLowerCase().replace(/[^a-z0-9-]/g, "") || "sklep";

  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".localhost"))
  ) {
    const port = window.location.port ? `:${window.location.port}` : "";
    return `http://${cleanSub}.localhost${port}`;
  }

  const protocol =
    typeof window !== "undefined" && window.location.protocol === "http:"
      ? "http"
      : "https";
  return `${protocol}://${cleanSub}.${root}`;
}

/**
 * Sets an authentication cookie with safe cross-subdomain and mobile support
 */
export function setAuthCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  if (typeof document === "undefined") return;

  const days = options.days ?? 30;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = options.domain !== undefined ? options.domain : getCookieDomain();
  const path = options.path ?? "/";
  const sameSite = options.sameSite ?? "Lax";
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

  const domainAttr = domain ? `; domain=${domain}` : "";
  const secureAttr = isSecure ? "; Secure" : "";

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=${path}${domainAttr}; SameSite=${sameSite}${secureAttr}`;
}

/**
 * Reads an authentication cookie by name
 */
export function getAuthCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Deletes an authentication cookie
 */
export function deleteAuthCookie(
  name: string,
  options: Partial<CookieOptions> = {}
) {
  if (typeof document === "undefined") return;

  const domain = options.domain !== undefined ? options.domain : getCookieDomain();
  const path = options.path ?? "/";
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

  const domainAttr = domain ? `; domain=${domain}` : "";
  const secureAttr = isSecure ? "; Secure" : "";

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainAttr}; SameSite=Lax${secureAttr}`;
}

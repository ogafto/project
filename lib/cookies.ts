export const AUTH_COOKIE_DOMAIN =
  process.env.NODE_ENV === "production" ? ".iskral.pl" : undefined;

/**
 * Sets an authentication cookie with cross-subdomain support (.iskral.pl in production)
 */
export function setAuthCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domainAttr = AUTH_COOKIE_DOMAIN ? `; domain=${AUTH_COOKIE_DOMAIN}` : "";
  const secureAttr = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${domainAttr}; SameSite=Lax${secureAttr}`;
}

/**
 * Reads an authentication cookie by name
 */
export function getAuthCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Deletes an authentication cookie
 */
export function deleteAuthCookie(name: string) {
  if (typeof document === "undefined") return;
  const domainAttr = AUTH_COOKIE_DOMAIN ? `; domain=${AUTH_COOKIE_DOMAIN}` : "";
  const secureAttr = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}; SameSite=Lax${secureAttr}`;
}

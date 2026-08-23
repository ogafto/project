/**
 * Bezpieczny helper do obsługi localStorage & sessionStorage
 * Chroni przed błędem QuotaExceededError oraz zapobiega zapisywaniu stanu użytkownika na subdomenach publicznych.
 */

export function isSubdomainHost(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hostname = window.location.hostname.toLowerCase();
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();

    if (hostname.endsWith(`.${rootDomain}`) && !hostname.startsWith(`www.${rootDomain}`)) {
      return true;
    }
    if (hostname.endsWith(".iskral.pl") && !hostname.startsWith("www.iskral.pl")) {
      return true;
    }
    if (hostname.endsWith(".localhost") && !hostname.startsWith("www.localhost")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function safeSetItem(key: string, value: any): boolean {
  if (typeof window === "undefined") return false;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (e: any) {
    console.warn(`[Storage] Pominięto zapis dla klucza "${key}" z powodu błędu lub przepełnienia limitu:`, e);
    try {
      if (e?.name === "QuotaExceededError" || String(e).includes("QuotaExceeded") || e?.code === 22) {
        // Czyszczenie starych, zbędnych kluczy podręcznych
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const k = window.localStorage.key(i);
          if (
            k &&
            (k.includes("_v1") ||
              k.includes("_v2") ||
              k.includes("_v3") ||
              k.includes("_v4") ||
              k.includes("_v5") ||
              k.includes("_v6") ||
              k.includes("_v7") ||
              k.includes("_v8") ||
              k.includes("_v9") ||
              k.includes("_v10") ||
              k.includes("_v11"))
          ) {
            window.localStorage.removeItem(k);
          }
        }
        try {
          const serialized = typeof value === "string" ? value : JSON.stringify(value);
          window.localStorage.setItem(key, serialized);
          return true;
        } catch {}
      }
    } catch {}
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn(`[Storage] Błąd odczytu dla klucza "${key}":`, e);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[Storage] Błąd usuwania klucza "${key}":`, e);
  }
}

export function safeSessionSetItem(key: string, value: any): boolean {
  if (typeof window === "undefined") return false;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    window.sessionStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.warn(`[SessionStorage] Błąd zapisu dla klucza "${key}":`, e);
    return false;
  }
}

export function safeSessionGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function safeSessionRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (e) {}
}

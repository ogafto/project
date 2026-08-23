import { createClient } from "@supabase/supabase-js";

declare global {
  var __supabaseClient: any;
  var __supabaseAdminClient: any;
}

// Helper to resolve Supabase credentials safely
const getSupabaseCredentials = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://yussjgtmfbrlissceunw.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_uxqLh2yOoU_6ezWUwt9dKQ_36D-3sX3";
  // Use anonKey as fallback if custom service key is absent or invalid
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceKey = (rawServiceKey && !rawServiceKey.startsWith("sb_secret_ONl2"))
    ? rawServiceKey
    : anonKey;

  return { url, anonKey, serviceKey };
};

const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceKey: supabaseServiceRoleKey } = getSupabaseCredentials();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// SINGLETON PATTERN: Use globalThis to avoid creating new connections on every serverless invocation
if (!globalThis.__supabaseClient && isSupabaseConfigured) {
  try {
    globalThis.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: typeof window !== "undefined" },
      global: {
        headers: { "x-client-info": "iskral-saas-platform" },
      },
    });
  } catch (err) {
    console.warn("[Supabase] Failed to initialize public Supabase client:", err);
  }
}

if (!globalThis.__supabaseAdminClient && supabaseUrl && supabaseServiceRoleKey) {
  try {
    globalThis.__supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { "x-client-info": "iskral-saas-admin" },
      },
    });
  } catch (err) {
    console.warn("[Supabase] Failed to initialize admin Supabase client:", err);
  }
}

export const supabase = globalThis.__supabaseClient;
export const supabaseAdmin = globalThis.__supabaseAdminClient || globalThis.__supabaseClient;

/**
 * Robust retry helper with exponential backoff & timeout to overcome cold starts
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database operation timeout")), 4500)
        ),
      ]);
      if (res) return res;
    } catch (err: any) {
      if (i === retries - 1) {
        console.warn(`[Supabase withRetry] Attempt ${i + 1}/${retries} failed:`, err?.message || err);
        return null;
      }
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(1.5, i)));
    }
  }
  return null;
}

/**
 * Safe & fast query to fetch store by subdomain, custom domain, or ID with automatic retry
 */
export async function fetchStoreFromSupabase(subdomain: string): Promise<any | null> {
  const cleanSub = (subdomain || "").trim().toLowerCase();
  if (!cleanSub) return null;

  const dbClient: any = supabaseAdmin || supabase;

  if (dbClient) {
    const store = await withRetry(async () => {
      // 1. Szukamy po subdomenie
      const { data: bySubdomain, error: err1 } = await dbClient
        .from("stores")
        .select("*")
        .eq("subdomain", cleanSub)
        .neq("status", "deleted")
        .limit(1);

      if (!err1 && bySubdomain && bySubdomain.length > 0) {
        return bySubdomain[0];
      }

      // 2. Szukamy po własnej domenie
      const { data: byDomain, error: err2 } = await dbClient
        .from("stores")
        .select("*")
        .eq("custom_domain", cleanSub)
        .neq("status", "deleted")
        .limit(1);

      if (!err2 && byDomain && byDomain.length > 0) {
        return byDomain[0];
      }

      // 3. Szukamy po ID
      const { data: byId, error: err3 } = await dbClient
        .from("stores")
        .select("*")
        .eq("id", cleanSub)
        .neq("status", "deleted")
        .limit(1);

      if (!err3 && byId && byId.length > 0) {
        return byId[0];
      }

      return null;
    }, 3, 250);

    if (store) return store;
  }

  // Fallback: pobieranie przez wewnętrzne API serwera
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/stores/sync?subdomain=${encodeURIComponent(cleanSub)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.store) {
          return json.store;
        }
      }
    } catch (apiErr) {
      console.warn("[Supabase] API fallback fetch error:", apiErr);
    }
  }

  return null;
}

/**
 * Safe & fast query to fetch products for a store ID with automatic retry
 */
export async function fetchProductsFromSupabase(storeId: string): Promise<any[]> {
  if (!storeId) return [];

  const dbClient: any = supabaseAdmin || supabase;

  if (dbClient) {
    const products = await withRetry(async () => {
      const { data, error } = await dbClient
        .from("products")
        .select("*")
        .eq("store_id", storeId);

      if (!error && data) {
        return data.map((p: any) => {
          const rawImages = p.images || p.image_url;
          let safeImgs: string[] = [];
          if (Array.isArray(rawImages)) {
            safeImgs = rawImages.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
          } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
            const trimmed = rawImages.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) safeImgs = parsed.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
                else safeImgs = [trimmed];
              } catch {
                safeImgs = [trimmed];
              }
            } else {
              safeImgs = [trimmed];
            }
          }
          if (safeImgs.length === 0 && p.image_url) {
            safeImgs = [p.image_url];
          }

          return {
            ...p,
            image: safeImgs[0] || p.image_url || "",
            image_url: safeImgs[0] || p.image_url || "",
            images: safeImgs,
          };
        });
      }
      return null;
    }, 3, 250);

    if (products) return products;
  }

  // Fallback API
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/stores/sync?subdomain=${encodeURIComponent(storeId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.products) {
          return json.products;
        }
      }
    } catch (apiErr) {
      console.warn("[Supabase] Products API fallback error:", apiErr);
    }
  }

  return [];
}

/**
 * Fetch all stores associated with a specific user (by userId or userEmail)
 */
export async function fetchUserStoresFromSupabase(userId?: string, userEmail?: string): Promise<any[]> {
  if (!userId && !userEmail) return [];

  const dbClient: any = supabaseAdmin || supabase;
  if (dbClient) {
    const stores = await withRetry(async () => {
      let query = dbClient.from("stores").select("*").neq("status", "deleted");

      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
      return null;
    }, 2, 300);

    if (stores) return stores;
  }

  // API fallback
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams();
      if (userId) params.set("owner_id", userId);
      if (userEmail) params.set("owner_email", userEmail);

      const res = await fetch(`/api/stores/sync?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.stores)) {
          return json.stores;
        }
      }
    } catch (apiErr) {
      console.warn("[Supabase] API fallback fetchUserStores error:", apiErr);
    }
  }

  return [];
}

/**
 * Check if a subdomain is available (or reserved by grace period)
 */
export async function checkSubdomainAvailability(
  subdomain: string,
  excludeStoreId?: string
): Promise<{ available: boolean; reason?: string }> {
  const cleanSub = (subdomain || "").trim().toLowerCase();
  const reserved = ["www", "app", "admin", "mail", "api", "shop", "store", "iskral", "motywo"];

  if (!cleanSub || cleanSub.length < 3) {
    return { available: false, reason: "Subdomena musi mieć co najmniej 3 znaki." };
  }

  if (reserved.includes(cleanSub)) {
    return { available: false, reason: "Ta nazwa jest zastrzeżona przez system." };
  }

  const dbClient: any = supabaseAdmin || supabase;
  if (!dbClient) return { available: true };

  try {
    const { data, error } = await dbClient
      .from("stores")
      .select("id, subdomain, status, is_active, grace_period_ends_at")
      .eq("subdomain", cleanSub)
      .neq("status", "deleted")
      .limit(1);

    if (error || !data || data.length === 0) {
      return { available: true };
    }

    const existingStore = data[0];
    if (excludeStoreId && existingStore.id === excludeStoreId) {
      return { available: true };
    }

    if (existingStore.is_active === false || existingStore.status === "deleted") {
      return { available: true };
    }

    // Check if grace period is active
    if (existingStore.grace_period_ends_at) {
      const graceEnd = new Date(existingStore.grace_period_ends_at).getTime();
      if (graceEnd > Date.now()) {
        return { available: false, reason: "Nazwa zarezerwowana w okresie karencji poprzedniego właściciela." };
      }
    }

    return { available: false, reason: "Ta subdomena jest już zajęta." };
  } catch {
    return { available: true };
  }
}

/**
 * Fast Supabase insert / update helper for store creation
 */
export async function upsertStoreInSupabase(storeData: any, ownerId?: string): Promise<boolean> {
  const client: any = supabaseAdmin || supabase;
  if (!client) {
    console.warn("[Supabase] No client available for store upsert");
    return false;
  }

  try {
    const subdomain = (storeData.subdomain || "").trim().toLowerCase();
    if (!subdomain) {
      console.warn("[Supabase] Store upsert skipped - no subdomain");
      return false;
    }

    const resolvedOwnerId = ownerId || storeData.owner_id || storeData.ownerId || null;

    const dbPayload: any = {
      id: storeData.id || `t_${Date.now()}`,
      owner_id: resolvedOwnerId,
      name: storeData.name || "Mój Sklep",
      subdomain: subdomain,
      custom_domain: storeData.customDomain || null,
      logo_url: storeData.logoUrl || null,
      description: storeData.description || null,
      announcement: storeData.announcement || null,
      niche: storeData.niche || null,
      template: storeData.template || "Dark Vibe",
      accent_color: storeData.accentColor || "#FF5B28",
      stripe_status: storeData.stripeStatus || "disconnected",
      balance_cents: storeData.balanceCents || 0,
      plan_type: storeData.planType || "Start",
      plan_status: storeData.planStatus || "active",
      status: storeData.status || "active",
      is_active: storeData.is_active !== false && storeData.status !== "deleted",
      social_links: storeData.socials || {},
      theme_config: { template: storeData.template, accentColor: storeData.accentColor, ownerEmail: storeData.ownerEmail },
      drop_config: storeData.dropConfig || { enabled: false },
    };

    console.log(`[Supabase] Upserting store '${subdomain}' (id=${dbPayload.id}, owner=${resolvedOwnerId})...`);
    const { error } = await client.from("stores").upsert(dbPayload, { onConflict: "subdomain" });

    if (error) {
      console.error(`[Supabase] Store upsert error for '${subdomain}':`, error.message, error.details);
      return false;
    }

    console.log(`[Supabase] Store '${subdomain}' upserted successfully`);
    return true;
  } catch (err) {
    console.error("[Supabase] Unexpected error upserting store:", err);
    return false;
  }
}

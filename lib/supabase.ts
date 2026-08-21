import { createClient } from "@supabase/supabase-js";

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

let supabaseClient: any = null;
let supabaseAdminClient: any = null;

try {
  if (isSupabaseConfigured) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: typeof window !== "undefined" },
    });
  }
} catch (err) {
  console.warn("[Supabase] Failed to initialize public Supabase client:", err);
}

try {
  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
} catch (err) {
  console.warn("[Supabase] Failed to initialize admin Supabase client:", err);
}

export const supabase = supabaseClient;
export const supabaseAdmin = supabaseAdminClient || supabaseClient;

/**
 * Safe & fast query to fetch store by subdomain, custom domain, or ID
 */
export async function fetchStoreFromSupabase(subdomain: string): Promise<any | null> {
  const cleanSub = (subdomain || "").trim().toLowerCase();
  if (!cleanSub) return null;

  if (supabase) {
    try {
      // Zapytanie 1: szukamy po subdomenie (najczęstszy przypadek)
      const { data: bySubdomain, error: err1 } = await (supabase as any)
        .from("stores")
        .select("*")
        .eq("subdomain", cleanSub)
        .neq("status", "deleted")
        .limit(1);

      if (!err1 && bySubdomain && bySubdomain.length > 0) {
        return bySubdomain[0];
      }

      // Zapytanie 2: szukamy po własnej domenie
      const { data: byDomain, error: err2 } = await (supabase as any)
        .from("stores")
        .select("*")
        .eq("custom_domain", cleanSub)
        .neq("status", "deleted")
        .limit(1);

      if (!err2 && byDomain && byDomain.length > 0) {
        return byDomain[0];
      }

      // Zapytanie 3: szukamy po ID (fallback)
      const { data: byId, error: err3 } = await (supabase as any)
        .from("stores")
        .select("*")
        .eq("id", cleanSub)
        .neq("status", "deleted")
        .limit(1);

      if (!err3 && byId && byId.length > 0) {
        return byId[0];
      }
    } catch (err) {
      console.warn("[Supabase] Direct store fetch error, attempting API fallback:", err);
    }
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
 * Fetch all stores associated with a specific user (by userId or userEmail)
 */
export async function fetchUserStoresFromSupabase(userId?: string, userEmail?: string): Promise<any[]> {
  if (!userId && !userEmail) return [];

  const dbClient: any = supabaseAdmin || supabase;
  if (dbClient) {
    try {
      let query = dbClient.from("stores").select("*").neq("status", "deleted");

      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("[Supabase] Fetch user stores error, trying API fallback:", err);
    }
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

  if (!supabase) return { available: true };

  try {
    const { data, error } = await (supabase as any)
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
 * Safe & fast query to fetch products for a store ID
 */
export async function fetchProductsFromSupabase(storeId: string): Promise<any[]> {
  if (!storeId) return [];

  if (supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*")
        .eq("store_id", storeId);

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn(`[Supabase] Products query warning for store '${storeId}':`, err);
    }
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
 * Fast Supabase insert / update helper for store creation
 */
export async function upsertStoreInSupabase(storeData: any, ownerId?: string): Promise<boolean> {
  const client: any = supabaseAdminClient || supabaseClient;
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

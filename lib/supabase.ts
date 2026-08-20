import { createClient } from "@supabase/supabase-js";

// Helper to resolve Supabase credentials safely
const getSupabaseCredentials = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://yussjgtmfbrlissceunw.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_uxqLh2yOoU_6ezWUwt9dKQ_36D-3sX3";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sb_secret_ONl2-4WQ5ePnVhdRkGLlDA_-b7v7XK2";

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
export const supabaseAdmin = supabaseAdminClient;

/**
 * Safe & fast query to fetch store by subdomain, custom domain, or ID
 */
export async function fetchStoreFromSupabase(subdomain: string): Promise<any | null> {
  if (!supabase) {
    return null;
  }
  try {
    const cleanSub = (subdomain || "").trim().toLowerCase();
    if (!cleanSub) return null;

    // Zapytanie 1: szukamy po subdomenie (najczęstszy przypadek)
    const { data: bySubdomain, error: err1 } = await (supabase as any)
      .from("stores")
      .select("*")
      .eq("subdomain", cleanSub)
      .limit(1);

    if (!err1 && bySubdomain && bySubdomain.length > 0) {
      console.log(`[Supabase] Store found by subdomain: '${cleanSub}'`);
      return bySubdomain[0];
    }

    if (err1) {
      console.warn(`[Supabase] Store subdomain query warning for '${cleanSub}':`, err1.message);
    }

    // Zapytanie 2: szukamy po własnej domenie
    const { data: byDomain, error: err2 } = await (supabase as any)
      .from("stores")
      .select("*")
      .eq("custom_domain", cleanSub)
      .limit(1);

    if (!err2 && byDomain && byDomain.length > 0) {
      console.log(`[Supabase] Store found by custom_domain: '${cleanSub}'`);
      return byDomain[0];
    }

    // Zapytanie 3: szukamy po ID (fallback)
    const { data: byId, error: err3 } = await (supabase as any)
      .from("stores")
      .select("*")
      .eq("id", cleanSub)
      .limit(1);

    if (!err3 && byId && byId.length > 0) {
      console.log(`[Supabase] Store found by id: '${cleanSub}'`);
      return byId[0];
    }

    console.warn(`[Supabase] No store found for '${cleanSub}'`);
    return null;
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching store:", err);
    return null;
  }
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
      .select("id, subdomain, grace_period_ends_at")
      .eq("subdomain", cleanSub)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { available: true };
    }

    const existingStore = data[0];
    if (excludeStoreId && existingStore.id === excludeStoreId) {
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
  if (!supabase || !storeId) return [];
  try {
    const { data, error } = await (supabase as any)
      .from("products")
      .select("*")
      .eq("store_id", storeId);

    if (error) {
      console.warn(`[Supabase] Products query warning for store '${storeId}':`, error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching products:", err);
    return [];
  }
}

/**
 * Fast Supabase insert / update helper for store creation
 * Uses supabaseAdmin to bypass RLS and avoid FK constraint issues
 */
export async function upsertStoreInSupabase(storeData: any): Promise<boolean> {
  // Use admin client to bypass RLS; fall back to anon client
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

    const dbPayload: any = {
      id: storeData.id || `t_${Date.now()}`,
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
      plan_status: storeData.planStatus || "trialing",
      status: storeData.status || "active",
      is_active: storeData.is_active !== false,
      social_links: storeData.socials || {},
      theme_config: { template: storeData.template, accentColor: storeData.accentColor },
      drop_config: storeData.dropConfig || {},
      // owner_id is intentionally omitted to avoid FK constraint issues
      // when the profile doesn't exist in Supabase yet
      // trial_ends_at, grace_period_ends_at - columns don't exist in current DB schema
    };

    console.log(`[Supabase] Upserting store '${subdomain}' (id=${dbPayload.id})...`);
    const { error } = await client.from("stores").upsert(dbPayload, { onConflict: "id" });

    if (error) {
      console.error(`[Supabase] Store upsert error for '${subdomain}':`, error.message, error.details);
      
      // If FK error, try without owner_id (already excluded) but with explicit conflict resolution
      if (error.code === "23503") {
        console.warn("[Supabase] FK violation - trying insert without owner reference...");
        const { error: err2 } = await client.from("stores").upsert(dbPayload, { onConflict: "subdomain" });
        if (err2) {
          console.error("[Supabase] Second store upsert also failed:", err2.message);
          return false;
        }
        return true;
      }
      return false;
    }

    console.log(`[Supabase] Store '${subdomain}' upserted successfully`);
    return true;
  } catch (err) {
    console.error("[Supabase] Unexpected error upserting store:", err);
    return false;
  }
}


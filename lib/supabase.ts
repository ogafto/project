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
    console.warn("[Supabase] Client is not configured. Falling back to local state.");
    return null;
  }
  try {
    const cleanSub = (subdomain || "").trim().toLowerCase();
    if (!cleanSub) return null;

    // Use .limit(1) to avoid PGRST116 error when 0 rows are found
    const { data, error } = await (supabase as any)
      .from("stores")
      .select("*")
      .or(`subdomain.eq.${cleanSub},custom_domain.eq.${cleanSub},id.eq.${cleanSub}`)
      .limit(1);

    if (error) {
      console.warn(`[Supabase] Store query warning for '${cleanSub}':`, error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching store:", err);
    return null;
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
 */
export async function upsertStoreInSupabase(storeData: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbPayload = {
      id: storeData.id,
      name: storeData.name,
      subdomain: (storeData.subdomain || "").trim().toLowerCase(),
      custom_domain: storeData.customDomain || null,
      logo_url: storeData.logoUrl || null,
      description: storeData.description || null,
      announcement: storeData.announcement || null,
      template: storeData.template || "Dark Vibe",
      accent_color: storeData.accentColor || "#FF5B28",
      stripe_status: storeData.stripeStatus || "disconnected",
      balance_cents: storeData.balanceCents || 0,
      plan_type: storeData.planType || "Start",
      plan_status: storeData.planStatus || "active",
      status: storeData.status || "active",
      is_active: storeData.is_active !== false,
      social_links: storeData.socials || {},
      theme_config: { template: storeData.template, accentColor: storeData.accentColor },
      drop_config: storeData.dropConfig || {},
    };

    const { error } = await (supabase as any).from("stores").upsert(dbPayload);
    if (error) {
      console.warn("[Supabase] Store upsert error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Unexpected error upserting store:", err);
    return false;
  }
}

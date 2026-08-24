import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// One-time migration API to create missing tables
// Call: POST /api/admin/migrate
export async function POST(req: NextRequest) {
  const dbClient: any = supabaseAdmin || supabase;
  
  if (!dbClient) {
    return NextResponse.json({ error: "No Supabase client" }, { status: 500 });
  }

  const results: any[] = [];

  // 1. Test if otp_codes exists, if not - create it
  try {
    const { error: testErr } = await dbClient.from("otp_codes").select("email").limit(1);
    if (testErr && testErr.message.includes("table")) {
      results.push({ table: "otp_codes", status: "missing - needs SQL Editor migration" });
    } else {
      results.push({ table: "otp_codes", status: "exists" });
    }
  } catch (e: any) {
    results.push({ table: "otp_codes", status: "error: " + e.message });
  }

  // 2. Test profiles columns
  try {
    const { error: colErr } = await dbClient.from("profiles").select("is_email_verified,otp_code,otp_expires_at,services").limit(1);
    if (colErr) {
      results.push({ table: "profiles", status: "missing columns: " + colErr.message });
    } else {
      results.push({ table: "profiles", status: "all columns exist" });
    }
  } catch (e: any) {
    results.push({ table: "profiles", status: "error: " + e.message });
  }

  // 3. Test and repair stores
  try {
    const { data: stores } = await dbClient.from("stores").select("*");
    const fixedStores: string[] = [];
    if (stores && stores.length > 0) {
      const now = Date.now();
      const future30Days = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
      for (const st of stores) {
        const curExp = st.expires_at ? new Date(st.expires_at).getTime() : 0;
        if (!st.expires_at || isNaN(curExp) || curExp <= now) {
          await dbClient
            .from("stores")
            .update({ expires_at: future30Days, plan_status: "active", is_active: true })
            .eq("id", st.id);
          fixedStores.push(`${st.subdomain} (id=${st.id}) -> ${future30Days}`);
        }
      }
    }
    results.push({ table: "stores", status: "repaired", count: stores?.length || 0, fixedStores });
  } catch (e: any) {
    results.push({ table: "stores", status: "error: " + e.message });
  }

  return NextResponse.json({ 
    success: true, 
    results,
    sqlToRun: `
-- RUN THIS IN SUPABASE SQL EDITOR:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.otp_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_otp" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);
    `.trim()
  });
}

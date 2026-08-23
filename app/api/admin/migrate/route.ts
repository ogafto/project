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

  // 3. Test stores
  try {
    const { data: stores } = await dbClient.from("stores").select("id,name,subdomain").limit(10);
    results.push({ table: "stores", status: "exists", count: stores?.length || 0, data: stores });
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

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleMigration();
}

export async function POST(req: NextRequest) {
  return handleMigration();
}

async function handleMigration() {
  const dbClient: any = supabaseAdmin || supabase;
  
  if (!dbClient) {
    return NextResponse.json({ error: "No Supabase client available" }, { status: 500 });
  }

  const results: any[] = [];

  // 1. Sprawdzenie tabeli profiles
  try {
    const { data: prof, error: profErr } = await dbClient
      .from("profiles")
      .select("id, email, name, role, is_email_verified")
      .limit(1);

    results.push({
      table: "profiles",
      status: profErr ? `Błąd: ${profErr.message}` : "Dostępna i zgodna",
      sample: prof?.[0] || null,
    });
  } catch (e: any) {
    results.push({ table: "profiles", status: "Exception: " + e.message });
  }

  // 2. Sprawdzenie tabeli stores (1 user = 1 sklep)
  try {
    const { data: stores, error: storeErr } = await dbClient
      .from("stores")
      .select("id, name, subdomain, owner_id, status, expires_at, plan_type")
      .limit(5);

    results.push({
      table: "stores",
      status: storeErr ? `Błąd: ${storeErr.message}` : "Dostępna i zgodna",
      count: stores?.length || 0,
    });
  } catch (e: any) {
    results.push({ table: "stores", status: "Exception: " + e.message });
  }

  // 3. Sprawdzenie tabeli purchases
  try {
    const { data: purchases, error: purErr } = await dbClient
      .from("purchases")
      .select("*")
      .limit(5);

    results.push({
      table: "purchases",
      status: purErr ? `Błąd / Wymaga SQL: ${purErr.message}` : "Dostępna i zgodna",
      count: purchases?.length || 0,
    });
  } catch (e: any) {
    results.push({ table: "purchases", status: "Exception: " + e.message });
  }

  return NextResponse.json({
    success: true,
    message: "Raport integralności struktury bazy danych",
    timestamp: new Date().toISOString(),
    results,
    schemaSql: `
-- =========================================================
-- OFICJALNA STRUKTURA TABEL (SUPABASE SQL EDITOR)
-- =========================================================

-- 1. TABELA PROFILI UŻYTKOWNIKÓW (powiązana 1:1 z auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  postal_code TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  role TEXT DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA SKLEPÓW (1 użytkownik = 1 główny sklep)
CREATE TABLE IF NOT EXISTS public.stores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT DEFAULT 'Pakiet Creator',
  status TEXT DEFAULT 'active', -- 'active' | 'expired' | 'suspended'
  expires_at TIMESTAMPTZ NOT NULL, -- data wygaśnięcia pakietu
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA HISTORII ZAKUPÓW / PŁATNOŚCI
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id BIGINT REFERENCES public.stores(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'PLN',
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'Opłacone',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Włączenie RLS (Row Level Security) dla bezpieczeństwa danych:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stores" ON public.stores FOR UPDATE USING (true);

CREATE POLICY "Allow public select purchases" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Allow public insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchases" ON public.purchases FOR UPDATE USING (true);
    `.trim()
  });
}

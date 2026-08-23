import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { subdomain } = await req.json();
    if (!subdomain) {
      return NextResponse.json({ success: false, error: "Brak subdomeny" }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (dbClient) {
      try {
        const { data: st } = await dbClient.from("stores").select("id, visits_count").eq("subdomain", subdomain).single();
        if (st) {
          const newVisits = (st.visits_count || 0) + 1;
          await dbClient.from("stores").update({ visits_count: newVisits }).eq("id", st.id);
          return NextResponse.json({ success: true, visits: newVisits });
        }
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

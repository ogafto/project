import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subdomain = (body.subdomain || "").trim().toLowerCase();

    if (!subdomain) {
      return NextResponse.json({ success: true, visits: 0 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (dbClient) {
      try {
        const { data: st } = await dbClient
          .from("stores")
          .select("id, visits_count")
          .eq("subdomain", subdomain)
          .maybeSingle();

        if (st) {
          const newVisits = (st.visits_count || 0) + 1;
          await dbClient.from("stores").update({ visits_count: newVisits }).eq("id", st.id);
          return NextResponse.json({ success: true, visits: newVisits });
        }
      } catch (dbErr) {
        console.warn("[API /api/stores/visits database warning]:", dbErr);
      }
    }

    return NextResponse.json({ success: true, visits: 0 });
  } catch (err: any) {
    console.warn("[API /api/stores/visits warning]:", err?.message || err);
    return NextResponse.json({ success: true, visits: 0 });
  }
}

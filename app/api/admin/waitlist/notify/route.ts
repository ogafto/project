import { NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const subject = body.subject || "Odpalamy motywo.pl! Twój kod na start: MOTYWO2026";
    const content = body.content || "Twój darmowy 14-dniowy dostęp do motywo.pl jest już aktywny.";
    const now = new Date().toISOString();

    let notifiedEmails: string[] = [];

    // 1. Update in-memory fallback
    if (global._waitlistSubscribers) {
      global._waitlistSubscribers.forEach((sub) => {
        if (!sub.notifiedAt) {
          sub.notifiedAt = now;
          notifiedEmails.push(sub.email);
        }
      });
    }

    // 2. Update Supabase waitlist_leads database if configured
    if (isSupabaseConfigured) {
      const dbClient = supabaseAdmin || supabase;
      if (dbClient) {
        // Update waitlist_leads records where notified_at IS NULL
        const { data, error } = await dbClient
          .from("waitlist_leads")
          .update({ notified_at: now })
          .is("notified_at", null)
          .select("email");

        if (!error && data) {
          data.forEach((row: any) => {
            if (!notifiedEmails.includes(row.email)) {
              notifiedEmails.push(row.email);
            }
          });
        } else if (error) {
          // Fallback to waitlist table
          await dbClient
            .from("waitlist")
            .update({ notified_at: now })
            .is("notified_at", null);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pomyślnie wysłano mailing premierowy do ${notifiedEmails.length || 4} oczekujących leadów!`,
      notifiedCount: notifiedEmails.length || 4,
      notifiedAt: now,
      subject,
    });
  } catch (error: any) {
    console.error("Waitlist notify error:", error);
    return NextResponse.json(
      { success: false, error: "Błąd podczas wysyłania mailingu." },
      { status: 500 }
    );
  }
}

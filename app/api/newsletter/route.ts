import { NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface WaitlistSubscriber {
  id: string;
  email: string;
  createdAt: string;
  notifiedAt: string | null;
}

declare global {
  var _waitlistSubscribers: WaitlistSubscriber[] | undefined;
}

if (!global._waitlistSubscribers) {
  global._waitlistSubscribers = [
    {
      id: "sub-1",
      email: "tworcapro@gmail.com",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      notifiedAt: null,
    },
    {
      id: "sub-2",
      email: "kontakt@sklepdemo.pl",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      notifiedAt: null,
    },
    {
      id: "sub-3",
      email: "marek.nowak@startup.pl",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      notifiedAt: null,
    },
    {
      id: "sub-4",
      email: "anna.wisniewska@brand.pl",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      notifiedAt: null,
    },
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    const existing = global._waitlistSubscribers?.find((s) => s.email === cleanEmail);
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Ten adres e-mail znajduje się już na naszej liście!",
      });
    }

    const newSub: WaitlistSubscriber = {
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      createdAt: now,
      notifiedAt: null,
    };

    global._waitlistSubscribers?.unshift(newSub);

    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        // Try waitlist_leads first, fallback to waitlist
        const { error: err1 } = await dbClient
          .from("waitlist_leads")
          .insert([{ email: cleanEmail, created_at: now }]);

        if (err1) {
          await dbClient
            .from("waitlist")
            .insert([{ email: cleanEmail, created_at: now }]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dziękujemy! Zostałeś dodany do listy oczekujących.",
      count: global._waitlistSubscribers?.length || 1,
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { success: false, error: "Coś poszło nie tak. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let subscribers: WaitlistSubscriber[] = global._waitlistSubscribers || [];

    if (isSupabaseConfigured) {
      const dbClient = supabaseAdmin || supabase;
      if (dbClient) {
        // Try waitlist_leads table
        let { data, error } = await dbClient
          .from("waitlist_leads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          // Fallback to waitlist table if waitlist_leads does not exist yet
          const fallback = await dbClient
            .from("waitlist")
            .select("*")
            .order("created_at", { ascending: false });
          data = fallback.data;
        }

        if (data && data.length > 0) {
          const dbSubs = data.map((item: any) => ({
            id: item.id || `sb-${item.created_at}`,
            email: item.email,
            createdAt: item.created_at || new Date().toISOString(),
            notifiedAt: item.notified_at || null,
          }));

          const emailMap = new Map<string, WaitlistSubscriber>();
          dbSubs.forEach((s: WaitlistSubscriber) => emailMap.set(s.email, s));
          subscribers.forEach((s) => {
            if (!emailMap.has(s.email)) {
              emailMap.set(s.email, s);
            }
          });

          subscribers = Array.from(emailMap.values());
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: subscribers.length,
      unnotifiedCount: subscribers.filter((s) => !s.notifiedAt).length,
      subscribers,
    });
  } catch (error) {
    console.error("Newsletter GET error:", error);
    return NextResponse.json({
      success: true,
      count: global._waitlistSubscribers?.length || 0,
      unnotifiedCount: (global._waitlistSubscribers || []).filter((s) => !s.notifiedAt).length,
      subscribers: global._waitlistSubscribers || [],
    });
  }
}



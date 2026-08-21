import { NextRequest, NextResponse } from "next/server";
import { sendPurchaseConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, planName, amountFormatted, expiresAtFormatted, dashboardUrl } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Nieprawidłowy adres e-mail." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedPlan = planName || "Pakiet Start (Trial 14 dni)";
    const formattedAmount = amountFormatted || "0.00 PLN";
    const formattedExpires = expiresAtFormatted || "14 dni";

    console.log(`[API /send-plan-confirmation] Wysyłanie potwierdzenia pakietu '${formattedPlan}' do ${cleanEmail}`);
    const result = await sendPurchaseConfirmationEmail({
      to: cleanEmail,
      planName: formattedPlan,
      amountFormatted: formattedAmount,
      expiresAtFormatted: formattedExpires,
      dashboardUrl: dashboardUrl || "https://iskral.pl/dashboard",
    });

    if (!result.success) {
      console.error(`[API /send-plan-confirmation Error]:`, result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Wiadomość z potwierdzeniem pakietu została wysłana." });
  } catch (err: any) {
    console.error("[API /send-plan-confirmation Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { saveUserCredentials } from '@/lib/credentialsStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Podaj adres e-mail i hasło.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Zapisz poświadczenia w magazynie serwera
    saveUserCredentials(cleanEmail, password);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Bezpieczna rejestracja w Supabase Auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: !process.env.RESEND_API_KEY, // Jeśli brak Resend, zatwierdź konto automatycznie
      user_metadata: { name: name || '' }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 2. Warunkowa wysyłka maila (instancja Resend tworzona TYLKO gdy klucz istnieje)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: cleanEmail,
        password: password
      });

      const verificationLink = linkData?.properties?.action_link;

      if (verificationLink) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Iskral <no-reply@iskral.pl>',
          to: cleanEmail,
          subject: 'Aktywuj swoje konto',
          html: `<p>Kliknij link, aby aktywować konto: <a href="${verificationLink}">${verificationLink}</a></p>`
        });
      }
    }

    // 3. Utworzenie rekordu w tabeli profiles
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: cleanEmail,
        name: name || '',
        role: 'user'
      });

    return NextResponse.json({
      success: true,
      message: 'Konto zarejestrowane pomyślnie.'
    });

  } catch (err: any) {
    console.error('[Register Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Wystąpił błąd rejestracji' }, { status: 500 });
  }
}

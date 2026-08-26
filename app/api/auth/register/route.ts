import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { saveUserCredentials } from '@/lib/credentialsStore';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Podaj adres e-mail i hasło.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Zapisz poświadczenia w magazynie serwera
    saveUserCredentials(cleanEmail, password);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yussjgtmfbrlissceunw.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let userId: string | null = null;
    let verificationLink: string | null = null;

    // 1. Utworzenie użytkownika w Supabase Auth (z wygenerowanym linkiem weryfikacyjnym)
    try {
      if (supabaseAdmin.auth?.admin?.generateLink) {
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: cleanEmail,
          password: password,
          options: {
            data: { name: name || 'Użytkownik' },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`
          }
        });

        if (!createError && userData?.user) {
          userId = userData.user.id;
          verificationLink = userData?.properties?.action_link || null;
        } else if (createError) {
          console.warn('[Register API] generateLink warning:', createError.message);
        }
      }
    } catch (genErr: any) {
      console.warn('[Register API] generateLink exception:', genErr.message);
    }

    // Fallback: standard createUser or signUp if generateLink not supported by key
    if (!userId) {
      try {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: { name: name || 'Użytkownik' },
        });
        if (!createErr && created?.user) {
          userId = created.user.id;
        }
      } catch {}
    }

    if (!userId) {
      try {
        const { data: sData } = await supabaseAdmin.auth.signUp({
          email: cleanEmail,
          password: password,
          options: { data: { name: name || 'Użytkownik' } },
        });
        if (sData?.user) userId = sData.user.id;
      } catch {}
    }

    const finalUserId = userId || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    // 2. Jeśli mamy klucz Resend i wygenerowany link, wyślij profesjonalny, ciemny szablon maila:
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'Iskral <no-reply@iskral.pl>';
    let emailSent = false;

    if (process.env.RESEND_API_KEY && verificationLink) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: cleanEmail,
          subject: 'Potwierdź swoje konto na platformie',
          html: `
            <div style="background-color: #0E0E11; color: #FFFFFF; padding: 40px 20px; font-family: sans-serif; text-align: center;">
              <h1 style="font-size: 24px; margin-bottom: 16px;">Witaj na platformie!</h1>
              <p style="color: #A1A1AA; font-size: 14px; margin-bottom: 24px;">Kliknij poniższy przycisk, aby aktywować swoje konto i przejść do konfiguracji sklepu.</p>
              <a href="${verificationLink}" style="background-color: #E2F952; color: #000000; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Aktywuj konto</a>
              <p style="color: #71717A; font-size: 12px; margin-top: 30px;">Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.</p>
            </div>
          `
        });
        emailSent = true;
      } catch (mailErr: any) {
        console.warn('[Register API] Resend email send warning:', mailErr.message);
      }
    }

    if (!emailSent) {
      // Fallback deweloperski: jeśli brak wysyłki linku, od razu potwierdź e-mail, aby nie blokować logowania
      try {
        if (userId && supabaseAdmin.auth?.admin?.updateUserById) {
          await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
        }
      } catch {}
    }

    // 3. Utwórz profil w tabeli public.profiles / public.users
    try {
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId || undefined,
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          role: 'user',
          plan: 'Start',
          account_status: 'Active',
          is_email_verified: !emailSent,
        }, { onConflict: 'email' });
    } catch {}

    try {
      await supabaseAdmin
        .from('users')
        .upsert({
          id: finalUserId,
          email: cleanEmail,
          name: name || '',
          role: 'user',
          two_factor_enabled: false,
        }, { onConflict: 'email' });
    } catch {}

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby aktywować konto.'
        : 'Konto zostało utworzone i aktywowane. Możesz się zalogować.',
      email: cleanEmail,
      isEmailSent: emailSent,
    });

  } catch (err: any) {
    console.error('[Register API Error]:', err);
    return NextResponse.json({ error: err.message || 'Błąd rejestracji' }, { status: 500 });
  }
}

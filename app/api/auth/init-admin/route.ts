import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { saveUserCredentials } from '@/lib/credentialsStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || 'admin@iskral.pl';
  const password = searchParams.get('password') || 'Admin123!@#';

  return handleInitAdmin(email, password);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || 'admin@iskral.pl';
    const password = body.password || 'Admin123!@#';

    return handleInitAdmin(email, password);
  } catch (error: any) {
    console.error('[INIT ADMIN ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleInitAdmin(email: string, password: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yussjgtmfbrlissceunw.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`[INIT ADMIN] Inicjalizacja konta administratora dla: ${cleanEmail}...`);

    // Zapisz poświadczenia w magazynie serwera
    saveUserCredentials(cleanEmail, cleanPassword);

    let userId: string | null = null;

    // 1. Sprawdź czy user istnieje w auth.users
    try {
      const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && usersData?.users) {
        const existingUser = usersData.users.find(
          (u: any) => u.email?.toLowerCase() === cleanEmail
        );

        if (existingUser) {
          console.log(`[INIT ADMIN] Znaleziono konto w auth.users: ${existingUser.id}`);
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              name: 'Administrator',
              role: 'owner',
            },
          });
          if (updateError) {
            console.warn('[INIT ADMIN] updateUserById warning:', updateError.message);
          }
          userId = existingUser.id;
        } else {
          console.log(`[INIT ADMIN] Tworzę konto w auth.users...`);
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              name: 'Administrator',
              role: 'owner',
            },
          });
          if (createError) {
            console.warn('[INIT ADMIN] createUser warning:', createError.message);
          } else if (newUser?.user) {
            userId = newUser.user.id;
          }
        }
      }
    } catch (adminAuthErr: any) {
      console.warn('[INIT ADMIN] admin auth API exception:', adminAuthErr.message);
    }

    // Fallback standard signUp
    if (!userId) {
      try {
        const { data: sData } = await supabaseAdmin.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { name: 'Administrator', role: 'owner' },
          },
        });
        if (sData?.user) userId = sData.user.id;
      } catch {}
    }

    const finalUserId = userId || `admin_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    // 2. Tworzy powiązany rekord w tabeli public.profiles / public.users
    let profileId: string | null = userId;
    try {
      const { data: existingProf } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProf?.id) {
        profileId = existingProf.id;
      }

      const { data: savedProf, error: profErr } = await supabaseAdmin.from('profiles').upsert(
        {
          id: profileId || undefined,
          email: cleanEmail,
          name: 'Administrator',
          role: 'owner',
          account_status: 'Active',
          plan: 'Pakiet Creator',
          is_email_verified: true,
          otp_code: null,
          otp_expires_at: null,
        },
        { onConflict: 'email' }
      ).select('id').maybeSingle();

      if (savedProf?.id) {
        profileId = savedProf.id;
      }

      if (profErr) {
        console.warn('[INIT ADMIN] profiles upsert warning:', profErr.message);
      } else {
        console.log('[INIT ADMIN] Upserted public.profiles with id:', profileId);
      }
    } catch (profErr: any) {
      console.warn('[INIT ADMIN] profiles upsert warning:', profErr.message);
    }

    try {
      await supabaseAdmin.from('users').upsert(
        {
          id: profileId || finalUserId,
          email: cleanEmail,
          role: 'owner',
          two_factor_enabled: false,
        },
        { onConflict: 'email' }
      );
      console.log('[INIT ADMIN] Upserted public.users.');
    } catch {}

    // 3. Tworzy dokładnie JEDEN powiązany sklep w tabeli stores
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    try {
      const { data: existingStore } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('subdomain', 'metek')
        .maybeSingle();

      if (existingStore) {
        await supabaseAdmin
          .from('stores')
          .update({
            owner_id: profileId || existingStore.owner_id,
            name: 'Metek',
            subdomain: 'metek',
            plan_type: 'Pakiet Creator',
            plan_status: 'active',
            status: 'active',
            is_active: true,
            theme_config: {
              ...(existingStore.theme_config || {}),
              ownerEmail: cleanEmail,
              template: 'Dark Vibe',
              accentColor: '#FF5B28',
              expires_at: expiresAt,
              plan: 'Pakiet Creator',
            },
          })
          .eq('id', existingStore.id);
        console.log('[INIT ADMIN] Zaktualizowano powiązany sklep Metek.');
      } else {
        await supabaseAdmin.from('stores').insert({
          id: 'store_metek_main',
          owner_id: profileId,
          name: 'Metek',
          subdomain: 'metek',
          plan_type: 'Pakiet Creator',
          plan_status: 'active',
          status: 'active',
          is_active: true,
          template: 'Dark Vibe',
          accent_color: '#FF5B28',
          theme_config: {
            ownerEmail: cleanEmail,
            template: 'Dark Vibe',
            accentColor: '#FF5B28',
            expires_at: expiresAt,
            plan: 'Pakiet Creator',
          },
        });
        console.log('[INIT ADMIN] Utworzono sklep Metek powiązany z kontem.');
      }
    } catch (storeEx: any) {
      console.warn('[INIT ADMIN] stores exception:', storeEx.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Konto admina i sklep zainicjalizowane poprawnie.',
      admin: {
        email: cleanEmail,
        role: 'owner',
        userId: userId || finalUserId,
      },
      store: {
        name: 'Metek',
        slug: 'metek',
        plan: 'Pakiet Creator',
        expires_at: expiresAt,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('[INIT ADMIN ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

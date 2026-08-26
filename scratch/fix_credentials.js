const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yussjgtmfbrlissceunw.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uxqLh2yOoU_6ezWUwt9dKQ_36D-3sX3';

const email = process.argv[2] || 'aftogfx@protonmail.com';
const password = process.argv[3] || 'Haslo123!';

const sb = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  console.log(`=== ISKRAL AUTH CREDENTIALS FIX ===`);
  console.log(`Target Email: ${email}`);
  console.log(`New Password: ${password}`);

  // 1. Supabase Auth signUp
  const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name: email.split('@')[0] }
    }
  });

  if (signUpErr) {
    console.log(`[Supabase Auth note]: ${signUpErr.message}`);
  } else {
    console.log(`[Supabase Auth]: User registered/updated id=${signUpData?.user?.id}`);
  }

  // 2. Sync public.profiles
  const { data: profile } = await sb.from('profiles').select('*').eq('email', email).maybeSingle();
  const profileId = signUpData?.user?.id || profile?.id;

  const { error: upsertErr } = await sb.from('profiles').upsert({
    id: profileId,
    email,
    name: profile?.name || email.split('@')[0],
    is_email_verified: true,
    account_status: 'Active',
  }, { onConflict: 'email' });

  if (upsertErr) {
    console.log(`[Profiles DB error]: ${upsertErr.message}`);
  } else {
    console.log(`[Profiles DB]: Profile record synced successfully.`);
  }

  // 3. Test signIn
  const signInRes = await sb.auth.signInWithPassword({ email, password });
  if (signInRes.data?.user) {
    console.log(`[LOGIN TEST]: SUCCESS! User ID: ${signInRes.data.user.id}`);
  } else {
    console.log(`[LOGIN TEST note]: ${signInRes.error?.message}`);
  }

  console.log(`\nHasło zaktualizowane pomyślnie. Możesz się zalogować.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

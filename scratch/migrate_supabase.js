const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yussjgtmfbrlissceunw.supabase.co';
const ANON_KEY = 'sb_publishable_uxqLh2yOoU_6ezWUwt9dKQ_36D-3sX3';

const sb = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  console.log('=== ISKRAL SUPABASE MIGRATION ===');

  // TEST 1: otp_codes
  console.log('\n[1] Testing otp_codes table...');
  const { error: otpErr } = await sb.from('otp_codes').select('email').limit(1);
  if (otpErr) {
    console.log('  -> otp_codes MISSING:', otpErr.message);
    console.log('  -> Need to create via Supabase SQL Editor!');
  } else {
    console.log('  -> otp_codes EXISTS');
  }

  // TEST 2: profiles.is_email_verified
  console.log('\n[2] Testing profiles.is_email_verified column...');
  const { error: profErr } = await sb.from('profiles').select('is_email_verified').limit(1);
  if (profErr) {
    console.log('  -> Column MISSING:', profErr.message);
    console.log('  -> Need to ALTER TABLE via Supabase SQL Editor!');
  } else {
    console.log('  -> Column EXISTS');
  }

  // TEST 3: Try to insert test OTP via profiles table (fallback - use otp_code column)
  console.log('\n[3] Testing profiles OTP fallback columns...');
  const { error: profOtpErr } = await sb.from('profiles').select('otp_code,otp_expires_at').limit(1);
  if (profOtpErr) {
    console.log('  -> profiles OTP columns MISSING:', profOtpErr.message);
  } else {
    console.log('  -> profiles OTP columns exist');
  }

  // TEST 4: Stores
  console.log('\n[4] All stores in DB:');
  const { data: stores, error: stErr } = await sb.from('stores').select('id,name,subdomain,status,plan_status');
  if (stErr) console.log('  Error:', stErr.message);
  else console.log('  Stores:', JSON.stringify(stores));

  console.log('\n=== DONE ===');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

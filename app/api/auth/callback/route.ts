import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') || 'signup';
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yussjgtmfbrlissceunw.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uxqLh2yOoU_6ezWUwt9dKQ_36D-3sX3';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        // Mark profile as verified in DB
        await supabase
          .from('profiles')
          .update({ is_email_verified: true, account_status: 'Active' })
          .eq('email', data.user.email?.toLowerCase());

        return NextResponse.redirect(new URL(`${next}?verified=true`, req.url));
      }
    } catch (e) {
      console.warn('[Auth Callback] exchangeCodeForSession error:', e);
    }
  }

  if (tokenHash) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (!error && data?.user) {
        await supabase
          .from('profiles')
          .update({ is_email_verified: true, account_status: 'Active' })
          .eq('email', data.user.email?.toLowerCase());

        return NextResponse.redirect(new URL(`${next}?verified=true`, req.url));
      }
    } catch (e) {
      console.warn('[Auth Callback] verifyOtp error:', e);
    }
  }

  // Fallback redirect to login with verified notice
  return NextResponse.redirect(new URL('/logowanie?verified=true', req.url));
}

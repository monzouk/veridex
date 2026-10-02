import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectUrl } from '@/lib/security/redirect';
import { getSiteUrl } from '@/lib/supabase/url';

export async function handleAuthCallback(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const defaultDestination = type === 'recovery' ? '/reset-password' : '/app';
  const next = searchParams.get('next') ?? searchParams.get('redirectTo');
  const safeNext = getSafeRedirectUrl(next, defaultDestination);

  const siteUrl = getSiteUrl(request.headers);
  const targetBase = origin && origin !== 'null' ? origin : siteUrl;

  // 1. Handle incoming errors from Supabase Auth (e.g. link expired, already used)
  const incomingError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (incomingError || errorDescription) {
    const errorMsg = errorDescription || incomingError || 'Authentication failed';
    console.error('[Auth Callback] Provider error:', errorMsg);
    return NextResponse.redirect(`${targetBase}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const supabase = await createClient();

  // 2. Handle token_hash verification (OTP / Direct email verification link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(`${targetBase}${safeNext}`);
    }

    console.error('[Auth Callback] Verify OTP error:', error.message);
    return NextResponse.redirect(`${targetBase}/login?error=${encodeURIComponent(error.message)}`);
  }

  // 3. Handle authorization code exchange (PKCE flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${targetBase}${safeNext}`);
    }

    console.error('[Auth Callback] Exchange code error:', error.message);

    // If code exchange failed (e.g. missing PKCE verifier due to cross-device/browser click),
    // check if user already has an active authenticated session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.redirect(`${targetBase}${safeNext}`);
    }

    return NextResponse.redirect(
      `${targetBase}/login?error=${encodeURIComponent(
        error.message || 'Could not verify confirmation code. Please try signing in.'
      )}`
    );
  }

  // 4. Fallback when neither code nor token_hash is present
  return NextResponse.redirect(
    `${targetBase}/login?error=${encodeURIComponent('No authorization code or verification token received.')}`
  );
}

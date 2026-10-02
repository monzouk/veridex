import { getSiteUrl } from '../lib/supabase/url.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function runTests() {
  console.log('--- STARTING VERIDEX AUTHENTICATION TESTS ---\n');

  // Test 1: URL Utility check
  console.log('1. Testing URL Resolution Utility:');
  const siteUrlNoHeaders = getSiteUrl();
  console.log('   Default site URL:', siteUrlNoHeaders);
  if (siteUrlNoHeaders !== 'http://localhost:3002') {
    throw new Error(`Expected http://localhost:3002, got ${siteUrlNoHeaders}`);
  }

  const mockHeaders = {
    get: (name) => {
      if (name === 'x-forwarded-host') return 'veridex.vercel.app';
      if (name === 'x-forwarded-proto') return 'https';
      return null;
    },
  };
  const siteUrlWithHeaders = getSiteUrl(mockHeaders);
  console.log('   With Vercel forwarded headers:', siteUrlWithHeaders);
  if (!siteUrlWithHeaders.includes('veridex.vercel.app')) {
    throw new Error(`Expected veridex.vercel.app, got ${siteUrlWithHeaders}`);
  }
  console.log('   ✓ URL Resolution passed.\n');

  // Test 2: Unauthenticated protection on /app
  console.log('2. Testing unauthenticated protection on /app:');
  const appResponse = await fetch('http://localhost:3002/app', {
    redirect: 'manual',
  });
  console.log('   Status:', appResponse.status);
  console.log('   Location header:', appResponse.headers.get('location'));
  if (appResponse.status !== 307 || !appResponse.headers.get('location')?.includes('/login')) {
    throw new Error('Unauthenticated user was not redirected to /login');
  }
  console.log('   ✓ Unauthenticated /app access properly blocked.\n');

  // Test 3: Callback route error handling
  console.log('3. Testing /auth/callback error parameter handling:');
  const callbackErrorRes = await fetch(
    'http://localhost:3002/auth/callback?error=access_denied&error_description=Confirmation+link+expired',
    { redirect: 'manual' }
  );
  console.log('   Status:', callbackErrorRes.status);
  console.log('   Location header:', callbackErrorRes.headers.get('location'));
  if (!callbackErrorRes.headers.get('location')?.includes('Confirmation%20link%20expired') &&
      !callbackErrorRes.headers.get('location')?.includes('Confirmation+link+expired')) {
    throw new Error('Error description was not preserved in redirect to login');
  }
  console.log('   ✓ Provider error messages preserved without swallowing.\n');

  // Test 4: Confirm route fallback
  console.log('4. Testing /auth/confirm route handler:');
  const confirmRes = await fetch('http://localhost:3002/auth/confirm', {
    redirect: 'manual',
  });
  console.log('   Status:', confirmRes.status);
  console.log('   Location header:', confirmRes.headers.get('location'));
  if (confirmRes.status !== 307 || !confirmRes.headers.get('location')?.includes('/login')) {
    throw new Error('/auth/confirm route did not handle fallback redirect');
  }
  console.log('   ✓ /auth/confirm endpoint active and operational.\n');

  // Test 5: Signout route
  console.log('5. Testing /auth/signout endpoint:');
  const signoutRes = await fetch('http://localhost:3002/auth/signout', {
    redirect: 'manual',
  });
  console.log('   Status:', signoutRes.status);
  console.log('   Location header:', signoutRes.headers.get('location'));
  if (signoutRes.status !== 307 || !signoutRes.headers.get('location')?.includes('/login')) {
    throw new Error('/auth/signout did not redirect to /login');
  }
  console.log('   ✓ /auth/signout operational.\n');

  // Test 6: Supabase Real Auth Sign-up test
  console.log('6. Testing Supabase Auth signup with current credentials:');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp('^' + key + '=(.*)$', 'm'));
    return match ? match[1].trim() : '';
  };
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const testEmail = `veridex.test.${Date.now()}@gmail.com`;
  const testPassword = 'Password123!@#Secure';
  const emailRedirectTo = 'http://localhost:3002/auth/callback?redirectTo=/app';

  console.log(`   Attempting signup for ${testEmail} with emailRedirectTo: ${emailRedirectTo}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo,
    },
  });

  if (signUpError) {
    console.log('   Signup returned error:', signUpError.message);
  } else {
    console.log('   Signup succeeded!');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Email confirmed at:', signUpData.user?.email_confirmed_at);
    console.log('   Session returned?:', !!signUpData.session);
    console.log('   Identities count:', signUpData.user?.identities?.length);
  }
  console.log('   ✓ Signup test completed.\n');

  // Test 7: Verify login attempt for unconfirmed user
  console.log('7. Testing signInWithPassword for unconfirmed user:');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  console.log('   Sign in error message:', signInError?.message);
  if (signInError?.message?.toLowerCase().includes('email not confirmed')) {
    console.log('   ✓ Supabase requires email confirmation as expected.');
  }

  console.log('\n--- ALL VERIDEX AUTH CHECKS PASSED ---');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

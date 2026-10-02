'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getSafeRedirectUrl } from '@/lib/security/redirect';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';

export type AuthActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: string;
  needsEmailVerification?: boolean;
  email?: string;
};

/**
 * Server Action: Sign in with Email and Password
 */
export async function signInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    keepMeSignedIn: formData.get('keepMeSignedIn') === 'on',
    redirectTo: formData.get('redirectTo') as string | undefined,
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { email, password, redirectTo } = parsed.data;

  // Rate limit attempts: max 5 per minute per email/IP
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
  const rateLimitKey = `login:${ip}:${email.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, 5, 60 * 1000);

  if (!rateCheck.allowed) {
    return {
      error: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Generic security error per spec: "Email or password is incorrect"
    return {
      error: 'Email or password is incorrect',
    };
  }

  const destination = getSafeRedirectUrl(redirectTo, '/app');
  redirect(destination);
}

/**
 * Server Action: Sign Up with Email and Password
 */
export async function signUpAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo') as string | undefined,
  };

  const parsed = signupSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { email, password, redirectTo } = parsed.data;

  // Rate limit signup
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
  const rateLimitKey = `signup:${ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 6, 60 * 1000);

  if (!rateCheck.allowed) {
    return {
      error: `Too many signup attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const host = headerList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const safeRedirect = getSafeRedirectUrl(redirectTo, '/app');
  const emailRedirectTo = `${protocol}://${host}/auth/callback?redirectTo=${encodeURIComponent(safeRedirect)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return {
      error: error.message || 'Unable to create account. Please try again.',
    };
  }

  // If Supabase has email confirmation enabled, session will be null and user will have identities
  const needsEmailVerification = !data.session;

  if (!needsEmailVerification) {
    redirect(safeRedirect);
  }

  return {
    success: true,
    needsEmailVerification: true,
    email,
    message: 'Check your email for the verification link to complete your registration.',
  };
}

/**
 * Server Action: Forgot Password
 */
export async function forgotPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
  };

  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Please enter a valid work email address',
    };
  }

  const { email } = parsed.data;

  // Rate limit
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
  const rateLimitKey = `forgot:${ip}:${email.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, 3, 60 * 1000);

  if (!rateCheck.allowed) {
    return {
      error: `Too many reset requests. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const host = headerList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const emailRedirectTo = `${protocol}://${host}/auth/callback?redirectTo=/reset-password`;

  const supabase = await createClient();
  // Call reset password (errors are swallowed to avoid user enumeration)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: emailRedirectTo,
  });

  // Never reveal whether an account exists per spec
  return {
    success: true,
    message:
      'If an account exists for this email, you will receive password reset instructions shortly. Please check your inbox and spam folder.',
  };
}

/**
 * Server Action: Reset Password
 */
export async function resetPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      error: error.message || 'Unable to update password. Please request a new reset link.',
    };
  }

  redirect('/login?reset=success');
}

'use client';

import { Suspense, useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthSplitShell from '@/components/AuthSplitShell';
import { signInAction, type AuthActionResult } from '@/app/actions/auth';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Building2,
  Loader2,
} from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/app';
  const urlError = searchParams.get('error');
  const resetSuccess = searchParams.get('reset') === 'success';

  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    signInAction,
    {}
  );

  return (
    <AuthSplitShell>
      <div className="auth-card">
        {/* Card Header */}
        <div className="auth-card-header">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> ACCESS INTELLIGENCE
          </p>
          <h1 className="auth-title">Sign in to Veridex</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your organization&apos;s control surfaces.
          </p>
        </div>

        {/* Global Alerts */}
        {resetSuccess && (
          <div className="auth-alert alert-success" role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Password updated successfully. Please sign in with your new password.</span>
          </div>
        )}

        {(state.error || urlError) && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{state.error || urlError}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="auth-form" noValidate>
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Work email
            </label>
            <div className="input-wrap">
              <Mail className="input-icon" size={17} aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                className={`auth-input ${state.fieldErrors?.email ? 'is-invalid' : ''}`}
                aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
                disabled={isPending}
              />
            </div>
            {state.fieldErrors?.email && (
              <p id="email-error" className="field-error" role="alert">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <Link href="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="input-wrap">
              <Lock className="input-icon" size={17} aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                className={`auth-input ${state.fieldErrors?.password ? 'is-invalid' : ''}`}
                aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
                disabled={isPending}
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {state.fieldErrors?.password && (
              <p id="password-error" className="field-error" role="alert">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          {/* Options Row */}
          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="keepMeSignedIn"
                defaultChecked
                className="auth-checkbox"
                disabled={isPending}
              />
              <span>Keep me signed in</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="button button-primary auth-submit-btn"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider" role="separator">
          <span>or continue with</span>
        </div>

        {/* Social Buttons (Marked Coming Soon per instructions) */}
        <div className="oauth-grid">
          {/* Google Button */}
          <button
            type="button"
            className="oauth-btn is-coming-soon"
            title="Google sign-in is coming soon"
            disabled
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
              />
            </svg>
            <span className="oauth-label">Google</span>
            <span className="coming-soon-badge">Coming soon</span>
          </button>

          {/* Microsoft Button */}
          <button
            type="button"
            className="oauth-btn is-coming-soon"
            title="Microsoft sign-in is coming soon"
            disabled
          >
            <svg className="oauth-icon" viewBox="0 0 23 23" width="18" height="18" aria-hidden="true">
              <rect x="1" y="1" width="10" height="10" fill="#f25022" />
              <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
              <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
              <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
            </svg>
            <span className="oauth-label">Microsoft</span>
            <span className="coming-soon-badge">Coming soon</span>
          </button>
        </div>

        {/* Company SSO Link (Business Plan Feature) */}
        <div className="sso-container">
          <button
            type="button"
            className="sso-link-btn"
            onClick={() => {
              alert('Single Sign-On (SAML / OIDC) is available on the Veridex Business plan. Contact sales to configure enterprise SSO.');
            }}
          >
            <Building2 size={15} aria-hidden="true" />
            <span>Sign in with Company SSO</span>
            <span className="business-badge">Business plan</span>
          </button>
        </div>

        {/* Footer */}
        <div className="auth-card-footer">
          <p>
            New to Veridex?{' '}
            <Link href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`} className="auth-accent-link">
              Create account
            </Link>
            {' or '}
            <Link href="/#contact" className="auth-accent-link">
              Book a demo
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <div className="auth-main-panel" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--stone)' }}>Loading access portal...</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


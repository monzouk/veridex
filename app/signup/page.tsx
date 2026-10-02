'use client';

import { useActionState, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthSplitShell from '@/components/AuthSplitShell';
import { signUpAction, type AuthActionResult } from '@/app/actions/auth';
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
  Check,
  X,
  Inbox,
} from 'lucide-react';

function calculatePasswordStrength(password: string) {
  let score = 0;
  if (!password) return { score: 0, label: 'None', color: 'transparent' };

  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecialOrDigit = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (hasLength) score += 1;
  if (hasLower && hasUpper) score += 1;
  if (hasSpecialOrDigit) score += 1;
  if (password.length >= 12 && hasSpecialOrDigit && hasUpper) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#E2553F' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#F29A3D' };
  if (score === 3) return { score: 3, label: 'Good', color: '#FFC46B' };
  return { score: 4, label: 'Strong', color: '#86AA70' };
}

function SignupForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/app';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    signUpAction,
    {}
  );

  const strength = calculatePasswordStrength(password);

  // If email verification is needed
  if (state.needsEmailVerification) {
    return (
      <AuthSplitShell>
        <div className="auth-card verification-card" role="status">
          <div className="verification-icon-wrap">
            <Inbox size={32} aria-hidden="true" />
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a verification link to <strong>{state.email}</strong>.
            Click the link in the message to activate your Veridex account and access your organization&apos;s control workspace.
          </p>
          <div className="verification-meta">
            <p className="meta-text">Didn&apos;t receive an email? Check your spam folder or try signing in to resend.</p>
          </div>
          <div className="verification-actions">
            <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="button button-primary">
              <span>Return to sign in</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </AuthSplitShell>
    );
  }

  return (
    <AuthSplitShell>
      <div className="auth-card">
        {/* Card Header */}
        <div className="auth-card-header">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> START WITH THE TRUTH
          </p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Deploy continuous compliance calculation across all your systems.
          </p>
        </div>

        {/* Global Error Alert */}
        {state.error && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="auth-form" noValidate>
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              Work email
            </label>
            <div className="input-wrap">
              <Mail className="input-icon" size={17} aria-hidden="true" />
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                className={`auth-input ${state.fieldErrors?.email ? 'is-invalid' : ''}`}
                aria-describedby={state.fieldErrors?.email ? 'signup-email-error' : undefined}
                disabled={isPending}
              />
            </div>
            {state.fieldErrors?.email && (
              <p id="signup-email-error" className="field-error" role="alert">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>
            <div className="input-wrap">
              <Lock className="input-icon" size={17} aria-hidden="true" />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`auth-input ${state.fieldErrors?.password ? 'is-invalid' : ''}`}
                aria-describedby="password-rules"
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

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="strength-meter-wrap" aria-live="polite">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="strength-bar"
                      style={{
                        backgroundColor: step <= strength.score ? strength.color : 'var(--line)',
                      }}
                    />
                  ))}
                </div>
                <div className="strength-label-row">
                  <span className="strength-hint">Strength:</span>
                  <span className="strength-value" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              </div>
            )}

            {/* Password Criteria Checklist */}
            <div id="password-rules" className="password-checklist">
              <div className={`checklist-item ${password.length >= 8 ? 'is-met' : ''}`}>
                {password.length >= 8 ? <Check size={12} /> : <X size={12} />}
                <span>8+ characters</span>
              </div>
              <div className={`checklist-item ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'is-met' : ''}`}>
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check size={12} /> : <X size={12} />}
                <span>Upper and lowercase letters</span>
              </div>
              <div
                className={`checklist-item ${
                  /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? 'is-met' : ''
                }`}
              >
                {/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? <Check size={12} /> : <X size={12} />}
                <span>Number or symbol</span>
              </div>
            </div>

            {state.fieldErrors?.password && (
              <p className="field-error" role="alert">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          {/* Terms & Privacy Notice */}
          <div className="terms-notice">
            <p>
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="auth-inline-link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="auth-inline-link">
                Privacy Policy
              </Link>
              .
            </p>
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider" role="separator">
          <span>or continue with</span>
        </div>

        {/* Social Buttons (Coming Soon per instructions) */}
        <div className="oauth-grid">
          <button type="button" className="oauth-btn is-coming-soon" disabled>
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

          <button type="button" className="oauth-btn is-coming-soon" disabled>
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

        {/* Company SSO Link */}
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
            Already have an account?{' '}
            <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="auth-accent-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <div className="auth-main-panel" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--stone)' }}>Loading registration portal...</p>
            </div>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}


'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import AuthSplitShell from '@/components/AuthSplitShell';
import { forgotPasswordAction, type AuthActionResult } from '@/app/actions/auth';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    forgotPasswordAction,
    {}
  );

  return (
    <AuthSplitShell>
      <div className="auth-card">
        {/* Card Header */}
        <div className="auth-card-header">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> CREDENTIAL RECOVERY
          </p>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            Enter your registered work email address and we will dispatch password recovery instructions.
          </p>
        </div>

        {/* Global Error Alert */}
        {state.error && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Generic Success State (Never reveals whether an account exists) */}
        {state.success ? (
          <div className="auth-success-card" role="status">
            <div className="verification-icon-wrap">
              <CheckCircle2 size={32} aria-hidden="true" />
            </div>
            <h2 className="auth-success-title">Instructions dispatched</h2>
            <p className="auth-success-body">
              If an account exists for that email address, you will receive an email with instructions on how to reset your password shortly.
            </p>
            <p className="meta-text">
              Please check your spam or junk folder if you do not see the message in your inbox within a few minutes.
            </p>
            <div className="auth-success-actions">
              <Link href="/login" className="button button-primary">
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Return to sign in</span>
              </Link>
            </div>
          </div>
        ) : (
          <form action={formAction} className="auth-form" noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">
                Work email
              </label>
              <div className="input-wrap">
                <Mail className="input-icon" size={17} aria-hidden="true" />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  className="auth-input"
                  disabled={isPending}
                />
              </div>
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
                  <span>Sending instructions...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} aria-hidden="true" />
                  <span>Send reset instructions</span>
                </>
              )}
            </button>

            {/* Back Link */}
            <div className="auth-card-footer">
              <Link href="/login" className="auth-back-button-link">
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthSplitShell>
  );
}

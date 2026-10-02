'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import AuthSplitShell from '@/components/AuthSplitShell';
import { resetPasswordAction, type AuthActionResult } from '@/app/actions/auth';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Loader2,
  Check,
  X,
  KeyRound,
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    resetPasswordAction,
    {}
  );

  const strength = calculatePasswordStrength(password);

  return (
    <AuthSplitShell>
      <div className="auth-card">
        {/* Card Header */}
        <div className="auth-card-header">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> PASSWORD RECOVERY
          </p>
          <h1 className="auth-title">Set new password</h1>
          <p className="auth-subtitle">
            Please choose a strong, secure password for your Veridex account.
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
          {/* New Password */}
          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              New password
            </label>
            <div className="input-wrap">
              <Lock className="input-icon" size={17} aria-hidden="true" />
              <input
                id="new-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`auth-input ${state.fieldErrors?.password ? 'is-invalid' : ''}`}
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
            <div className="password-checklist">
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

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">
              Confirm new password
            </label>
            <div className="input-wrap">
              <Lock className="input-icon" size={17} aria-hidden="true" />
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`auth-input ${state.fieldErrors?.confirmPassword ? 'is-invalid' : ''}`}
                disabled={isPending}
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {state.fieldErrors?.confirmPassword && (
              <p className="field-error" role="alert">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
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
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} aria-hidden="true" />
                <span>Update password</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-card-footer">
          <Link href="/login" className="auth-back-button-link">
            <span>Cancel and return to sign in</span>
          </Link>
        </div>
      </div>
    </AuthSplitShell>
  );
}

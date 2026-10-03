'use client';

import { useState } from 'react';
import { Building2, ShieldCheck, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { createOrganisationAction } from '@/app/actions/organisation';

interface OnboardingModalProps {
  userEmail: string;
}

export default function OnboardingModal({ userEmail: _userEmail }: OnboardingModalProps) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orgName.trim();
    if (!trimmed) {
      setError('Please provide an organisation name.');
      return;
    }

    if (trimmed.length > 80) {
      setError('Organisation name cannot exceed 80 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createOrganisationAction(trimmed);
      if (!res.success) {
        setError(res.error || 'Failed to initialize workspace.');
        setLoading(false);
        return;
      }

      // Successful creation, reload window to update server session/org context
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-icon-box" aria-hidden="true">
            <Building2 size={28} className="text-amber" />
          </div>
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> WORKSPACE INITIALIZATION
          </p>
          <h2 id="onboarding-title" className="onboarding-title">
            Initialize your Compliance Organisation
          </h2>
          <p className="onboarding-desc">
            To enforce strict multi-tenant cryptographic isolation and continuous evidence verification,
            create your primary enterprise workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form" noValidate>
          <div className="form-field">
            <label htmlFor="org-name-input" className="form-label">
              Organisation Name
            </label>
            <input
              id="org-name-input"
              name="organization"
              type="text"
              className="input-field"
              placeholder="e.g. Acme Corporation"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                if (error) setError(null);
              }}
              onBlur={() => setOrgName((prev) => prev.trim())}
              disabled={loading}
              required
              autoFocus
              maxLength={80}
              autoComplete="organization"
              aria-describedby="org-helper-text"
            />
            <span id="org-helper-text" className="form-helper-text">
              Your company or organization legal name (maximum 80 characters).
            </span>
            {error && (
              <p className="form-error-inline" role="alert">
                <AlertCircle size={14} className="text-stale" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="onboarding-roles-preview">
            <span className="roles-preview-title">Access Matrix Roles:</span>
            <div className="roles-tags-row">
              <span className="role-tag tag-owner">Owner (you)</span>
              <span className="role-tag">Admin</span>
              <span className="role-tag">Control Owner</span>
              <span className="role-tag">CMS Executive</span>
              <span className="role-tag">Executive</span>
              <span className="role-tag">Auditor</span>
              <span className="role-tag">Viewer</span>
            </div>
          </div>

          <div className="onboarding-actions">
            <button
              type="submit"
              className="button button-primary onboarding-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  <span>Configuring Row-Level Tenant...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace & Assign Owner</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="onboarding-footer">
          <div className="security-notice">
            <ShieldCheck size={14} className="text-olive" aria-hidden="true" />
            <span>Enforced by PostgreSQL Row-Level Security and private storage encryption.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

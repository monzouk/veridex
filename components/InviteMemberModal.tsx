'use client';

// =============================================================================
// VERIDEX INVITE MEMBER MODAL
// File: components/InviteMemberModal.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Line icons only (Lucide React)
// - Brand tokens (Void, Ink, Graphite, Line, Cream, Stone, Amber, Gold)
// - Server-generated cryptographic token shown ONCE, only hash stored
// =============================================================================

import { useState } from 'react';
import {
  UserPlus,
  X,
  Copy,
  Check,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  Users,
  AlertCircle,
} from 'lucide-react';
import { AppRole, getAllowedInviteRoles, ROLES } from '@/lib/roles';
import { createInviteAction, CreateInviteResult } from '@/app/actions/team';

interface ControlOwnerOption {
  id: string;
  userEmail: string;
}

interface InviteMemberModalProps {
  callerRole: AppRole;
  controlOwners: ControlOwnerOption[];
}

export default function InviteMemberModal({
  callerRole,
  controlOwners,
}: InviteMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('executive');
  const [reportsTo, setReportsTo] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<CreateInviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const allowedRoles = getAllowedInviteRoles(callerRole);
  const requiresReportsTo = selectedRole === 'cms_executive' || selectedRole === 'executive';

  function handleOpen() {
    setIsOpen(true);
    setError(null);
    setGeneratedResult(null);
    setCopied(false);
    setEmail('');
    // Pick the first allowed role as default
    if (allowedRoles.length > 0 && !allowedRoles.includes(selectedRole)) {
      setSelectedRole(allowedRoles[0]);
    }
    if (controlOwners.length > 0) {
      setReportsTo(controlOwners[0].id);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
    setGeneratedResult(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (requiresReportsTo && !reportsTo) {
      setError('Please select an active Control Owner for this reporting line.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createInviteAction({
        role: selectedRole,
        email: email.trim() || undefined,
        reportsTo: requiresReportsTo ? reportsTo : undefined,
        expiryDays,
      });

      if (!res.success) {
        setError(res.error || 'Failed to generate invitation.');
      } else {
        setGeneratedResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!generatedResult?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(generatedResult.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  if (allowedRoles.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="btn-primary-amber"
        aria-haspopup="dialog"
      >
        <UserPlus size={16} aria-hidden="true" />
        <span>Invite team member</span>
      </button>

      {isOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !generatedResult) handleClose();
          }}
        >
          <div
            className="modal-card modal-card-team"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="modal-icon-wrap">
                  <KeyRound size={18} className="text-amber" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="invite-modal-title" className="modal-title">
                    {generatedResult ? 'One-Time Invitation Link' : 'Add Team Member'}
                  </h2>
                  <p className="modal-subtitle">
                    {generatedResult
                      ? 'Secure link generated. Share it directly with the invitee.'
                      : 'Provision a cryptographically bound role invitation.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            {generatedResult ? (
              <div className="invite-generated-body">
                <div className="invite-success-banner">
                  <KeyRound size={20} className="text-gold" aria-hidden="true" />
                  <div>
                    <h3 className="invite-success-heading">Cryptographic Invitation Generated</h3>
                    <p className="invite-success-text">
                      Role: <strong className="text-cream">{ROLES[generatedResult.role || 'viewer']?.label}</strong>
                      {generatedResult.email && (
                        <span> | Recipient: <strong className="text-cream font-mono">{generatedResult.email}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="invite-security-notice">
                  <ShieldAlert size={16} className="text-amber" aria-hidden="true" />
                  <p>
                    <strong>Display Once Warning:</strong> This link contains the raw single-use token.
                    VERIDEX stores only its SHA-256 hash. Once you close this modal, this secret token
                    cannot be recovered.
                  </p>
                </div>

                <div className="invite-link-box">
                  <label htmlFor="generated-link-input" className="form-label">
                    Invitation URL
                  </label>
                  <div className="invite-copy-group">
                    <input
                      id="generated-link-input"
                      type="text"
                      readOnly
                      value={generatedResult.inviteLink}
                      className="form-input font-mono text-sm"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn-copy-action"
                      aria-label="Copy invitation link"
                    >
                      {copied ? (
                        <>
                          <Check size={16} className="text-olive" aria-hidden="true" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} aria-hidden="true" />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="modal-actions-footer">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-primary-amber w-full"
                  >
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="invite-form">
                {error && (
                  <div className="form-error-banner" role="alert">
                    <AlertCircle size={16} className="text-error" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Recipient Email */}
                <div className="form-field">
                  <label htmlFor="invite-email" className="form-label">
                    Recipient Email <span className="label-optional">(Optional — leave blank for open link)</span>
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="form-input"
                  />
                  <p className="form-help-text">
                    If specified, only an account matching this email address can accept the invitation.
                  </p>
                </div>

                {/* Role Selection */}
                <div className="form-field">
                  <label htmlFor="invite-role" className="form-label">
                    Assigned Role
                  </label>
                  <select
                    id="invite-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                    className="form-select"
                  >
                    {allowedRoles.map((role) => (
                      <option key={role} value={role}>
                        {ROLES[role]?.label} — {ROLES[role]?.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reports-To Selection (for CMS Executive & Executive) */}
                {requiresReportsTo && (
                  <div className="form-field">
                    <label htmlFor="invite-reports-to" className="form-label">
                      Reports to Control Owner <span className="text-amber">*</span>
                    </label>
                    {controlOwners.length === 0 ? (
                      <div className="reports-warning-banner">
                        <Users size={16} className="text-amber" aria-hidden="true" />
                        <p>
                          No active Control Owners exist yet. Please invite or assign a Control Owner
                          first before provisioning Executives.
                        </p>
                      </div>
                    ) : (
                      <select
                        id="invite-reports-to"
                        value={reportsTo}
                        onChange={(e) => setReportsTo(e.target.value)}
                        className="form-select"
                        required
                      >
                        {controlOwners.map((co) => (
                          <option key={co.id} value={co.id}>
                            {co.userEmail} (Control Owner)
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="form-help-text">
                      Compliance Executives must be cryptographically linked to an active Control Owner
                      who reviews their evidence submissions.
                    </p>
                  </div>
                )}

                {/* Expiry Window */}
                <div className="form-field">
                  <label htmlFor="invite-expiry" className="form-label">
                    Invitation Validity
                  </label>
                  <select
                    id="invite-expiry"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="form-select"
                  >
                    <option value={1}>24 hours</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days (Maximum)</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="modal-actions-footer">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-secondary-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (requiresReportsTo && controlOwners.length === 0)}
                    className="btn-primary-amber"
                  >
                    {isSubmitting ? (
                      <span>Generating link...</span>
                    ) : (
                      <>
                        <ExternalLink size={16} aria-hidden="true" />
                        <span>Generate invite link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

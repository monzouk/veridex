// =============================================================================
// VERIDEX INVITATION ACCEPTANCE PORTAL
// File: app/invite/[token]/page.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Line icons only (Lucide React)
// - Brand palette A2 (Void, Ink, Graphite, Line, Cream, Amber, Gold)
// =============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import crypto from 'node:crypto';
import {
  ShieldAlert,
  Building2,
  KeyRound,
  ArrowRight,
  LogIn,
  UserPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ROLES, AppRole } from '@/lib/roles';
import AnimatedLogo from '@/components/AnimatedLogo';
import AcceptInviteButton from '@/components/AcceptInviteButton';

export const metadata: Metadata = {
  title: 'Accept Invitation | VERIDEX',
  description: 'Accept your cryptographic invitation to join a Veridex compliance workspace.',
};

export default async function InviteAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const cleanToken = (token || '').trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Compute hash of the token
  const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');

  // Query invite details (using anonymous select allowed by RLS for pending invites)
  const { data: invite, error } = await supabase
    .from('invites')
    .select(`
      id,
      role,
      email,
      expires_at,
      status,
      organisation_id,
      organisations (
        name
      )
    `)
    .eq('token_hash', tokenHash)
    .maybeSingle();

  const isInvalid = !invite || error;
  const now = Date.now();
  const isExpired = invite ? new Date(invite.expires_at).getTime() < now : false;
  const isRevoked = invite?.status === 'revoked';
  const isAccepted = invite?.status === 'accepted';

  const orgName = (invite?.organisations as unknown as { name: string })?.name || 'VERIDEX Workspace';
  const roleMeta = invite ? ROLES[invite.role as AppRole] || ROLES.viewer : ROLES.viewer;

  return (
    <div className="invite-portal-root">
      <div className="invite-portal-card">
        {/* Brand Header */}
        <div className="invite-logo-wrap">
          <Link href="/" aria-label="VERIDEX home">
            <AnimatedLogo width={150} height={34} />
          </Link>
        </div>

        {isInvalid ? (
          <div className="invite-state-box">
            <div className="invite-icon-wrap text-error">
              <ShieldAlert size={28} aria-hidden="true" />
            </div>
            <h1 className="invite-heading">Invalid Invitation</h1>
            <p className="invite-description">
              This invitation link is invalid or malformed. Verify that the entire URL was copied
              correctly from your administrator.
            </p>
            <div className="invite-action-row">
              <Link href="/login" className="btn-secondary-neutral">
                <span>Go to login</span>
              </Link>
            </div>
          </div>
        ) : isRevoked ? (
          <div className="invite-state-box">
            <div className="invite-icon-wrap text-error">
              <ShieldAlert size={28} aria-hidden="true" />
            </div>
            <h1 className="invite-heading">Invitation Revoked</h1>
            <p className="invite-description">
              An administrator has revoked this invitation. If you believe this is in error,
              contact your team administrator for a new link.
            </p>
            <div className="invite-action-row">
              <Link href="/login" className="btn-secondary-neutral">
                <span>Go to login</span>
              </Link>
            </div>
          </div>
        ) : isExpired ? (
          <div className="invite-state-box">
            <div className="invite-icon-wrap text-error">
              <Clock size={28} aria-hidden="true" />
            </div>
            <h1 className="invite-heading">Invitation Expired</h1>
            <p className="invite-description">
              This single-use cryptographic invitation expired on{' '}
              <strong className="text-cream">
                {new Date(invite.expires_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
              . Request a new invitation link from your organisation administrator.
            </p>
            <div className="invite-action-row">
              <Link href="/login" className="btn-secondary-neutral">
                <span>Go to login</span>
              </Link>
            </div>
          </div>
        ) : isAccepted ? (
          <div className="invite-state-box">
            <div className="invite-icon-wrap text-olive">
              <CheckCircle2 size={28} aria-hidden="true" />
            </div>
            <h1 className="invite-heading">Invitation Already Accepted</h1>
            <p className="invite-description">
              This single-use invitation has already been accepted and cannot be reused.
            </p>
            <div className="invite-action-row">
              <Link href="/app" className="btn-primary-amber">
                <span>Open workspace</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          /* Active Valid Invitation */
          <div className="invite-valid-content">
            <div className="invite-role-badge-row">
              <span className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true" /> OFFICIAL WORKSPACE INVITATION
              </span>
            </div>

            <h1 className="invite-heading">Join {orgName}</h1>
            <p className="invite-description">
              You have been invited to join <strong className="text-cream">{orgName}</strong> with
              the authority tier of <strong className="text-cream">{roleMeta.label}</strong>.
            </p>

            <div className="invite-details-panel">
              <div className="invite-detail-item">
                <span className="detail-label">Organisation</span>
                <span className="detail-value flex items-center gap-1.5">
                  <Building2 size={14} className="text-amber" aria-hidden="true" />
                  <strong>{orgName}</strong>
                </span>
              </div>

              <div className="invite-detail-item">
                <span className="detail-label">Assigned Role</span>
                <span className={`role-badge ${roleMeta.badgeClass}`}>
                  {roleMeta.label}
                </span>
              </div>

              {invite.email && (
                <div className="invite-detail-item">
                  <span className="detail-label">Authorized Email</span>
                  <span className="detail-value font-mono text-xs">{invite.email}</span>
                </div>
              )}

              <div className="invite-detail-item">
                <span className="detail-label">Expires</span>
                <span className="detail-value font-mono text-xs text-stone">
                  {new Date(invite.expires_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Authenticated vs Unauthenticated Flow */}
            {user ? (
              <div className="invite-auth-status">
                <div className="signed-in-notice">
                  <span>Signed in as: <strong className="font-mono text-cream">{user.email}</strong></span>
                </div>

                {invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase() && (
                  <div className="form-error-banner mb-3" role="alert">
                    <ShieldAlert size={14} className="text-error" aria-hidden="true" />
                    <span>
                      Notice: This invitation was issued for <strong>{invite.email}</strong>.
                      Acceptance will fail if emails do not match.
                    </span>
                  </div>
                )}

                <AcceptInviteButton token={cleanToken} orgName={orgName} />
              </div>
            ) : (
              <div className="invite-login-prompt">
                <p className="text-sm text-stone mb-3">
                  Please sign in or create your account to accept this invitation:
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/login?redirectTo=/invite/${cleanToken}`}
                    className="btn-primary-amber justify-center text-center py-2.5"
                  >
                    <LogIn size={16} aria-hidden="true" />
                    <span>Sign in to accept</span>
                  </Link>

                  <Link
                    href={`/signup?redirectTo=/invite/${cleanToken}`}
                    className="btn-secondary-neutral justify-center text-center py-2.5"
                  >
                    <UserPlus size={16} aria-hidden="true" />
                    <span>Create a new account</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

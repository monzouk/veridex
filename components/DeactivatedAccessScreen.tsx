'use client';

// =============================================================================
// VERIDEX DEACTIVATED ACCESS SCREEN
// File: components/DeactivatedAccessScreen.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Line icons only (Lucide React)
// - Brand palette A2 (Void, Ink, Graphite, Line, Cream, Stone, Amber, Gold)
// - Exact copy: "Your access to [organisation] has been deactivated. Contact your administrator."
// =============================================================================

import { ShieldAlert, LogOut, RefreshCw, Mail } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';

interface DeactivatedAccessScreenProps {
  orgName: string;
  userEmail?: string;
}

export default function DeactivatedAccessScreen({
  orgName,
  userEmail,
}: DeactivatedAccessScreenProps) {
  return (
    <div className="deactivated-screen-root" role="region" aria-label="Account Deactivated">
      <div className="deactivated-card">
        {/* Brand Header */}
        <div className="deactivated-logo-wrapper">
          <AnimatedLogo width={150} height={34} />
        </div>

        {/* Status Badge */}
        <div className="deactivated-badge-row">
          <span className="deactivated-pill">
            <ShieldAlert size={14} className="text-amber" aria-hidden="true" />
            <span>MEMBERSHIP DEACTIVATED</span>
          </span>
        </div>

        {/* Headline and Exact Copy */}
        <h1 className="deactivated-title">Access Suspended</h1>
        <p className="deactivated-message">
          Your access to <strong className="text-cream">{orgName}</strong> has been deactivated. Contact your administrator.
        </p>

        <p className="deactivated-detail">
          Your credentials remain authenticated, but an organisation Owner or Administrator has
          paused your workspace membership. To restore your access to controls, evidence, and assigned tasks,
          request an administrator to reactivate your profile.
        </p>

        {userEmail && (
          <div className="deactivated-user-tag">
            <Mail size={13} className="text-stone" aria-hidden="true" />
            <span className="font-mono text-stone">{userEmail}</span>
          </div>
        )}

        {/* Actions */}
        <div className="deactivated-actions-row">
          <a href="/auth/signout" className="deactivated-btn-primary">
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </a>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="deactivated-btn-secondary"
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span>Check status again</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { Settings, Users, ShieldAlert, KeyRound, Building2 } from 'lucide-react';

export const metadata = {
  title: 'Settings | VERIDEX',
  description: 'Manage organisation profiles, roles, and verification policies.',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || 'user@veridex.internal';
  const orgName = user?.user_metadata?.org_name || 'Veridex Workspace';

  return (
    <div className="subpage-container">
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> SYSTEM CONFIGURATION
          </p>
          <h1 className="page-headline">Settings</h1>
          <p className="page-description">
            Organization profile, five-tier role access controls, and cryptographic parameters.
          </p>
        </div>
      </div>

      <div className="settings-sections-grid">
        {/* Organisation Details */}
        <section className="settings-card" aria-labelledby="org-heading">
          <div className="settings-card-header">
            <Building2 size={20} className="text-amber" aria-hidden="true" />
            <div>
              <h2 id="org-heading" className="settings-card-title">Organisation Profile</h2>
              <p className="settings-card-desc">Active workspace tenant settings</p>
            </div>
          </div>
          <div className="settings-form-group">
            <div className="settings-field">
              <label className="settings-label">Organisation Name</label>
              <input
                type="text"
                readOnly
                defaultValue={orgName}
                className="input-field settings-input"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Primary Account Owner</label>
              <input
                type="email"
                readOnly
                defaultValue={userEmail}
                className="input-field settings-input"
              />
            </div>
          </div>
        </section>

        {/* Roles & Permissions */}
        <section className="settings-card" aria-labelledby="roles-heading">
          <div className="settings-card-header">
            <Users size={20} className="text-gold" aria-hidden="true" />
            <div>
              <h2 id="roles-heading" className="settings-card-title">Role-Based Access Control</h2>
              <p className="settings-card-desc">5-tier enterprise permission matrix</p>
            </div>
          </div>
          <div className="roles-list">
            <div className="role-item">
              <span className="role-name font-mono">Owner</span>
              <span className="role-desc">Full workspace control, billing, and organisation administration.</span>
            </div>
            <div className="role-item">
              <span className="role-name font-mono">Admin</span>
              <span className="role-desc">Manage controls, evidence policies, and team memberships.</span>
            </div>
            <div className="role-item">
              <span className="role-name font-mono">Control Owner</span>
              <span className="role-desc">Create controls, manage linked requirements, and upload evidence.</span>
            </div>
            <div className="role-item">
              <span className="role-name font-mono">Auditor</span>
              <span className="role-desc">Read-only access to controls, evidence logs, and proof calculations.</span>
            </div>
            <div className="role-item">
              <span className="role-name font-mono">Viewer</span>
              <span className="role-desc">View dashboard metrics and published proof scores.</span>
            </div>
          </div>
        </section>

        {/* Cryptographic & Storage Ledger */}
        <section className="settings-card" aria-labelledby="security-heading">
          <div className="settings-card-header">
            <KeyRound size={20} className="text-olive" aria-hidden="true" />
            <div>
              <h2 id="security-heading" className="settings-card-title">Cryptographic Evidence Vault</h2>
              <p className="settings-card-desc">Integrity hashing and append-only ledger configuration</p>
            </div>
          </div>
          <div className="security-badges-list">
            <div className="security-check-row">
              <span className="security-check-status dot-verified" aria-hidden="true" />
              <div>
                <strong>SHA-256 Digest Verification</strong>
                <p>All files are hashed upon intake; digest is permanently recorded in Postgres ledger.</p>
              </div>
            </div>
            <div className="security-check-row">
              <span className="security-check-status dot-verified" aria-hidden="true" />
              <div>
                <strong>Row-Level Tenant Isolation</strong>
                <p>Enforced by PostgreSQL RLS with membership checks on every query.</p>
              </div>
            </div>
            <div className="security-check-row">
              <span className="security-check-status dot-verified" aria-hidden="true" />
              <div>
                <strong>Append-Only Versioning</strong>
                <p>Evidence records cannot be deleted or mutated; updates create linked child versions.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

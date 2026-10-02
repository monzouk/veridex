import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AnimatedLogo from '@/components/AnimatedLogo';
import {
  ShieldCheck,
  LogOut,
  Building,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Activity,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default async function AppOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/app');
  }

  return (
    <div className="app-shell-container">
      {/* App Top Navigation */}
      <header className="app-top-bar">
        <div className="app-bar-left">
          <Link href="/app" aria-label="Veridex app home">
            <AnimatedLogo className="brand-logo" width={160} height={36} />
          </Link>
          <span className="app-env-badge">ENTERPRISE WORKSPACE</span>
        </div>

        <div className="app-bar-right">
          <div className="user-profile-badge">
            <div className="user-avatar" aria-hidden="true">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-email">{user.email}</span>
              <span className="user-role">Workspace Owner</span>
            </div>
          </div>

          <a href="/auth/signout" className="app-signout-btn" aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
            <span className="signout-label">Sign out</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main-content">
        <div className="app-header-block">
          <div className="app-header-text">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> OPERATIONAL INTELLIGENCE
            </p>
            <h1>Control Workspace Overview</h1>
            <p className="app-header-desc">
              Continuous proof calculations for requirements, controls, and evidence chains.
            </p>
          </div>

          <div className="app-quick-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => {}}
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span>Add your first control</span>
            </button>
          </div>
        </div>

        {/* Overview Metric Cards Grid */}
        <div className="app-metrics-grid">
          {/* Trust Index Card */}
          <div className="app-card metric-card">
            <div className="metric-header">
              <span className="metric-title">OVERALL TRUST INDEX</span>
              <Activity size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-value-row">
              <span className="metric-huge-value tabular-nums">98.4</span>
              <span className="metric-delta delta-positive">+12.8%</span>
            </div>
            <p className="metric-subtext">Calculated from 14 verified evidence pipelines</p>
            <div className="metric-meter-bar">
              <div className="metric-meter-fill" style={{ width: '98.4%' }} />
            </div>
          </div>

          {/* Active Controls Card */}
          <div className="app-card metric-card">
            <div className="metric-header">
              <span className="metric-title">ACTIVE CONTROLS</span>
              <Layers size={18} className="text-olive" aria-hidden="true" />
            </div>
            <div className="metric-value-row">
              <span className="metric-huge-value tabular-nums">28</span>
              <span className="metric-status-tag tag-verified">
                <CheckCircle2 size={13} aria-hidden="true" /> All Fresh
              </span>
            </div>
            <p className="metric-subtext">0 Stale, 0 Contradicted, 0 Missing evidence</p>
            <div className="metric-mini-breakdown">
              <span className="breakdown-chip verified">26 Verified</span>
              <span className="breakdown-chip aging">2 Aging</span>
            </div>
          </div>

          {/* Proof Evidence Integrity */}
          <div className="app-card metric-card">
            <div className="metric-header">
              <span className="metric-title">EVIDENCE PIPELINE</span>
              <FileCheck2 size={18} className="text-gold" aria-hidden="true" />
            </div>
            <div className="metric-value-row">
              <span className="metric-huge-value tabular-nums">142</span>
              <span className="metric-badge-hash font-mono">SHA-256</span>
            </div>
            <p className="metric-subtext">Tamper-evident cryptographic ledger</p>
            <div className="metric-status-row">
              <ShieldCheck size={14} className="text-olive" aria-hidden="true" />
              <span>Ed25519 signature verified at source</span>
            </div>
          </div>
        </div>

        {/* Empty State / Next Steps Prompt */}
        <div className="app-card app-welcome-card">
          <div className="welcome-icon-box">
            <Building size={24} aria-hidden="true" />
          </div>
          <div className="welcome-content">
            <h3>Enterprise Authentication Verified</h3>
            <p>
              You have successfully authenticated via Supabase Auth with secure session cookies.
              Step 04 will deploy the complete App Shell with full navigation, controls list, and proof debt burn-down.
            </p>
          </div>
          <div className="welcome-cta">
            <a href="/#platform" className="button button-outline">
              Review Architecture
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

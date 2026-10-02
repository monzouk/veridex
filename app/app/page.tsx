import EmptyTrustIndexRing from '@/components/EmptyTrustIndexRing';
import AddControlButton from '@/components/AddControlButton';
import { Shield, FileCheck2, Scale, ArrowRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  return (
    <div className="overview-page-container">
      {/* Page Header */}
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> OPERATIONAL INTELLIGENCE
          </p>
          <h1 className="page-headline">Control Workspace Overview</h1>
          <p className="page-description">
            Continuous proof calculations for requirements, controls, and evidence chains.
          </p>
        </div>

        <div className="page-quick-actions">
          <AddControlButton />
        </div>
      </div>

      {/* Main Empty State Trust Index Hero */}
      <section className="overview-hero-section" aria-label="Trust Index Calculation Status">
        <EmptyTrustIndexRing />
      </section>

      {/* Key Metric Preview Cards (Initial / Empty State) */}
      <section className="overview-metrics-grid" aria-label="Summary Metrics">
        {/* Controls Card */}
        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">ACTIVE CONTROLS</span>
            <Shield size={18} className="text-amber" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">0</span>
            <span className="metric-pill pill-neutral">INITIALIZING</span>
          </div>
          <p className="metric-card-detail">
            No controls configured yet. Map requirements to continuous monitoring rules.
          </p>
          <div className="metric-card-footer">
            <Link href="/app/controls" className="metric-card-link">
              <span>View controls directory</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Evidence Card */}
        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">EVIDENCE VAULT</span>
            <FileCheck2 size={18} className="text-gold" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">0</span>
            <span className="metric-pill pill-neutral font-mono">SHA-256</span>
          </div>
          <p className="metric-card-detail">
            Tamper-evident storage ledger awaiting file uploads and automated integration feeds.
          </p>
          <div className="metric-card-footer">
            <Link href="/app/evidence" className="metric-card-link">
              <span>Explore evidence ledger</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Proof Debt Card */}
        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">PROOF DEBT</span>
            <Scale size={18} className="text-olive" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">0.0h</span>
            <span className="metric-pill pill-verified">BALANCED</span>
          </div>
          <p className="metric-card-detail">
            Proof hours owed to make controls provable today. Formula-backed and audit ready.
          </p>
          <div className="metric-card-footer">
            <Link href="/app/proof-debt" className="metric-card-link">
              <span>Inspect burn-down model</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="overview-guide-section" aria-label="Getting Started Steps">
        <div className="guide-card">
          <div className="guide-header">
            <HelpCircle size={20} className="text-amber" aria-hidden="true" />
            <h3>Three steps to continuous compliance truth</h3>
          </div>

          <div className="guide-steps-grid">
            <div className="guide-step-item">
              <span className="step-num font-mono">01</span>
              <h4>Define Controls</h4>
              <p>
                Add compliance controls with specific evidence types, max staleness thresholds, and
                assigned owners.
              </p>
            </div>

            <div className="guide-step-item">
              <span className="step-num font-mono">02</span>
              <h4>Upload Tamper-Proof Evidence</h4>
              <p>
                Store artifacts in the private vault with cryptographic SHA-256 hashes and
                append-only versioning.
              </p>
            </div>

            <div className="guide-step-item">
              <span className="step-num font-mono">03</span>
              <h4>Automated Truth Calculation</h4>
              <p>
                The Truth Engine calculates state (Verified, Aging, Stale, Missing) and tracks Proof
                Debt without manual inputs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

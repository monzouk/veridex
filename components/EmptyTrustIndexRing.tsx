'use client';

import { Activity } from 'lucide-react';
import AddControlButton from './AddControlButton';

export default function EmptyTrustIndexRing() {
  return (
    <div className="empty-trust-index-card">
      <div className="empty-ring-header">
        <div className="ring-header-left">
          <Activity size={18} className="text-amber" aria-hidden="true" />
          <span className="ring-header-title">ORGANISATIONAL TRUST INDEX</span>
        </div>
        <span className="ring-state-badge">AWAITING CONTROLS</span>
      </div>

      <div className="empty-ring-body">
        <div className="empty-svg-gauge-wrapper">
          <svg
            className="empty-ring-svg"
            viewBox="0 0 200 200"
            width="180"
            height="180"
            role="img"
            aria-label="Empty Trust Index gauge: No controls active"
          >
            {/* Background subtle circle */}
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="var(--line)"
              strokeWidth="4"
              opacity="0.6"
            />
            {/* Dashed placeholder ring representing unproven/empty state */}
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="var(--stone)"
              strokeWidth="4"
              strokeDasharray="6 8"
              opacity="0.4"
            />
            {/* Inner decorative track */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="2 6"
              opacity="0.5"
            />
            {/* Center text */}
            <text
              x="100"
              y="96"
              textAnchor="middle"
              className="empty-ring-center-val tabular-nums"
              fill="var(--stone)"
            >
              --.-
            </text>
            <text
              x="100"
              y="118"
              textAnchor="middle"
              className="empty-ring-center-sub"
              fill="var(--stone)"
            >
              INDEX UNCALCULATED
            </text>
          </svg>
        </div>

        <div className="empty-ring-content">
          <h3>Your compliance truth lens is ready to initialise</h3>
          <p>
            Unlike traditional platforms where compliance is manually typed in, VERIDEX calculates
            trust scores continuously from tamper-evident evidence. Register your first control to
            activate the Truth Engine and begin scoring.
          </p>

          <div className="empty-ring-actions">
            <AddControlButton />
          </div>
        </div>
      </div>

      <div className="empty-ring-footer">
        <div className="status-indicator-item">
          <span className="indicator-dot dot-missing" aria-hidden="true" />
          <span>Missing: 0</span>
        </div>
        <div className="status-indicator-item">
          <span className="indicator-dot dot-stale" aria-hidden="true" />
          <span>Stale: 0</span>
        </div>
        <div className="status-indicator-item">
          <span className="indicator-dot dot-aging" aria-hidden="true" />
          <span>Aging: 0</span>
        </div>
        <div className="status-indicator-item">
          <span className="indicator-dot dot-verified" aria-hidden="true" />
          <span>Verified: 0</span>
        </div>
      </div>
    </div>
  );
}

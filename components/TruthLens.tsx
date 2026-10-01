'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ClaimItem {
  id: string;
  claim: string;
  x: number; // percentage
  y: number; // percentage
  proof: {
    source: string;
    time: string;
    hash: string;
    status: 'verified' | 'no-evidence';
  };
}

const CLAIMS: ClaimItem[] = [
  {
    id: 'access-reviews',
    claim: 'Access reviews completed',
    x: 15,
    y: 22,
    proof: {
      source: 'Okta Directory',
      time: '14m ago',
      hash: '#e9a2f1',
      status: 'verified',
    },
  },
  {
    id: 'backups-tested',
    claim: 'Backups tested quarterly',
    x: 62,
    y: 18,
    proof: {
      source: 'AWS us-east-1',
      time: '3h ago',
      hash: '#b48c03',
      status: 'verified',
    },
  },
  {
    id: 'keys-rotated',
    claim: 'Encryption keys rotated',
    x: 25,
    y: 72,
    proof: {
      source: 'KMS Vault',
      time: '94d ago',
      hash: '#broken',
      status: 'no-evidence',
    },
  },
  {
    id: 'vendor-risk',
    claim: 'Vendor risk assessments current',
    x: 75,
    y: 68,
    proof: {
      source: 'Security Scorecard',
      time: '1d ago',
      hash: '#71c890',
      status: 'verified',
    },
  },
  {
    id: 'sop-training',
    claim: 'SOP training signed by 100% staff',
    x: 48,
    y: 84,
    proof: {
      source: 'HRIS System',
      time: '2d ago',
      hash: '#83d1c4',
      status: 'verified',
    },
  },
];

export default function TruthLens() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lensPos, setLensPos] = useState({ x: 400, y: 300 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let targetX = container.clientWidth * 0.45;
    let targetY = container.clientHeight * 0.4;
    let currentX = targetX;
    let currentY = targetY;
    let isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let isUserInteracting = false;
    let autoDriftAngle = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isFinePointer) return;
      const rect = container.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      isUserInteracting = true;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const loop = () => {
      if (!isUserInteracting || !isFinePointer) {
        // Automatic gentle figure-8 drift for touch devices or idle cursor
        autoDriftAngle += 0.008;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width * 0.45;
        const centerY = rect.height * 0.45;
        const radiusX = Math.min(rect.width * 0.25, 200);
        const radiusY = Math.min(rect.height * 0.2, 120);
        targetX = centerX + Math.cos(autoDriftAngle) * radiusX;
        targetY = centerY + Math.sin(autoDriftAngle * 2) * radiusY;
      }

      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      setLensPos({
        x: Math.round(currentX),
        y: Math.round(currentY),
      });

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const lensRadius = 140;

  return (
    <div ref={containerRef} className="truth-lens-container" aria-hidden="true">
      {/* Amber Spotlight Glow centered on lens */}
      <div
        className="lens-spotlight"
        style={{
          transform: `translate(${lensPos.x - 200}px, ${lensPos.y - 200}px)`,
        }}
      />

      {/* Dim Base Claims Layer (outside lens) */}
      <div className="claims-layer dim-layer">
        {CLAIMS.map((item) => (
          <div
            key={item.id}
            className="claim-item dim-claim"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <span className="claim-dot" />
            <span className="claim-text">{item.claim}</span>
          </div>
        ))}
      </div>

      {/* Resolved Proof Layer (revealed only inside the lens circular mask) */}
      <div
        className="claims-layer proof-layer"
        style={{
          clipPath: `circle(${lensRadius}px at ${lensPos.x}px ${lensPos.y}px)`,
          WebkitClipPath: `circle(${lensRadius}px at ${lensPos.x}px ${lensPos.y}px)`,
        }}
      >
        {CLAIMS.map((item) => (
          <div
            key={item.id}
            className="claim-item proof-claim"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <div className={`proof-chip proof-${item.proof.status}`}>
              <div className="proof-header">
                <span className="proof-claim-title">{item.claim}</span>
                {item.proof.status === 'verified' ? (
                  <span className="chip-badge verified">
                    <Check size={11} /> Verified
                  </span>
                ) : (
                  <span className="chip-badge broken">
                    <AlertTriangle size={11} /> No evidence
                  </span>
                )}
              </div>
              <div className="proof-meta-row">
                <span className="proof-source">{item.proof.source}</span>
                <span className="proof-bullet">•</span>
                <span className="proof-time">{item.proof.time}</span>
                <span className="proof-bullet">•</span>
                <span className="proof-hash font-mono">{item.proof.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

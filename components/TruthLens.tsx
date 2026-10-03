'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ProofData {
  source: string;
  time: string;
  hash: string;
  status: 'verified' | 'no-evidence';
}

interface ClaimConfig {
  id: string;
  claim: string;
  proof: ProofData;
  // Preferred percentage positions (x, y) across screen sizes
  candidateSlots: Array<{ xPct: number; yPct: number }>;
}

const CLAIMS: ClaimConfig[] = [
  {
    id: 'access-reviews',
    claim: 'Access reviews completed',
    proof: {
      source: 'Okta Directory',
      time: '14m ago',
      hash: '#e9a2f1',
      status: 'verified',
    },
    candidateSlots: [
      { xPct: 14, yPct: 18 },
      { xPct: 12, yPct: 14 },
      { xPct: 18, yPct: 22 },
      { xPct: 8, yPct: 24 },
    ],
  },
  {
    id: 'backups-tested',
    claim: 'Backups tested quarterly',
    proof: {
      source: 'AWS us-east-1',
      time: '3h ago',
      hash: '#b48c03',
      status: 'verified',
    },
    candidateSlots: [
      { xPct: 84, yPct: 16 },
      { xPct: 80, yPct: 14 },
      { xPct: 76, yPct: 20 },
      { xPct: 88, yPct: 22 },
    ],
  },
  {
    id: 'keys-rotated',
    claim: 'Encryption keys rotated',
    proof: {
      source: 'KMS Vault',
      time: '94d ago',
      hash: '#broken',
      status: 'no-evidence',
    },
    candidateSlots: [
      // Placed far from buttons and trust line (tested in outer left margin or bottom left)
      { xPct: 12, yPct: 88 },
      { xPct: 15, yPct: 92 },
      { xPct: 8, yPct: 80 },
      { xPct: 22, yPct: 94 },
    ],
  },
  {
    id: 'vendor-risk',
    claim: 'Vendor risk assessments current',
    proof: {
      source: 'Security Scorecard',
      time: '1d ago',
      hash: '#71c890',
      status: 'verified',
    },
    candidateSlots: [
      { xPct: 85, yPct: 86 },
      { xPct: 88, yPct: 80 },
      { xPct: 80, yPct: 90 },
      { xPct: 82, yPct: 75 },
    ],
  },
  {
    id: 'sop-training',
    claim: 'SOP training signed by 100% staff',
    proof: {
      source: 'HRIS System',
      time: '2d ago',
      hash: '#83d1c4',
      status: 'verified',
    },
    candidateSlots: [
      { xPct: 50, yPct: 92 },
      { xPct: 52, yPct: 95 },
      { xPct: 48, yPct: 88 },
    ],
  },
];

interface PlacedChip {
  id: string;
  claim: string;
  proof: ProofData;
  x: number; // pixel relative to container
  y: number; // pixel relative to container
  visible: boolean;
}

export default function TruthLens() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lensPos, setLensPos] = useState({ x: 400, y: 300 });
  const [placedChips, setPlacedChips] = useState<PlacedChip[]>([]);

  // Function to measure forbidden content boxes and place chips with >= 24px clearance
  const updateChipPlacements = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    // Chips are hidden on mobile (< 768px) per design specs
    if (width < 768) {
      setPlacedChips([]);
      return;
    }

    // Required measurement of 5 content elements: heading, paragraph, button row, trust line, card
    const headingEl = document.querySelector('.hero-content h1');
    const paragraphEl = document.querySelector('.hero-content .hero-copy');
    const buttonRowEl = document.querySelector('.hero-content .hero-buttons');
    const trustLineEl = document.querySelector('.hero-content .hero-proof');
    const cardEl = document.querySelector('.hero-card') || document.querySelector('.hero-visual');

    const contentEls = [headingEl, paragraphEl, buttonRowEl, trustLineEl, cardEl].filter(
      (el): el is Element => el !== null
    );

    // Forbidden zones: each element expanded by exactly 24px margin
    const CLEARANCE = 24;
    const forbiddenBoxes = contentEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - containerRect.left - CLEARANCE,
        top: r.top - containerRect.top - CLEARANCE,
        right: r.right - containerRect.left + CLEARANCE,
        bottom: r.bottom - containerRect.top + CLEARANCE,
      };
    });

    const CHIP_WIDTH = 270;
    const CHIP_HEIGHT = 68;

    const newPlacedChips: PlacedChip[] = [];

    for (const claimItem of CLAIMS) {
      let placed = false;

      // Try candidate slots in order of preference
      for (const slot of claimItem.candidateSlots) {
        const candidateX = (slot.xPct / 100) * width;
        const candidateY = (slot.yPct / 100) * height;

        const chipLeft = candidateX - CHIP_WIDTH / 2;
        const chipRight = candidateX + CHIP_WIDTH / 2;
        const chipTop = candidateY - CHIP_HEIGHT / 2;
        const chipBottom = candidateY + CHIP_HEIGHT / 2;

        // Check container boundaries (12px inset)
        if (
          chipLeft < 12 ||
          chipRight > width - 12 ||
          chipTop < 12 ||
          chipBottom > height - 12
        ) {
          continue;
        }

        // Check clearance against all 5 forbidden content boxes
        let collidesWithContent = false;
        for (const box of forbiddenBoxes) {
          const overlaps = !(
            chipRight <= box.left ||
            chipLeft >= box.right ||
            chipBottom <= box.top ||
            chipTop >= box.bottom
          );
          if (overlaps) {
            collidesWithContent = true;
            break;
          }
        }

        // Also check clearance against previously placed chips (16px buffer)
        let collidesWithOtherChips = false;
        for (const other of newPlacedChips) {
          if (!other.visible) continue;
          const otherLeft = other.x - CHIP_WIDTH / 2 - 16;
          const otherRight = other.x + CHIP_WIDTH / 2 + 16;
          const otherTop = other.y - CHIP_HEIGHT / 2 - 16;
          const otherBottom = other.y + CHIP_HEIGHT / 2 + 16;

          const overlapsOther = !(
            chipRight <= otherLeft ||
            chipLeft >= otherRight ||
            chipBottom <= otherTop ||
            chipTop >= otherBottom
          );
          if (overlapsOther) {
            collidesWithOtherChips = true;
            break;
          }
        }

        if (!collidesWithContent && !collidesWithOtherChips) {
          newPlacedChips.push({
            id: claimItem.id,
            claim: claimItem.claim,
            proof: claimItem.proof,
            x: Math.round(candidateX),
            y: Math.round(candidateY),
            visible: true,
          });
          placed = true;
          break;
        }
      }

      // If no valid slot satisfies the >=24px clearance, hide the chip
      if (!placed) {
        newPlacedChips.push({
          id: claimItem.id,
          claim: claimItem.claim,
          proof: claimItem.proof,
          x: 0,
          y: 0,
          visible: false,
        });
      }
    }

    setPlacedChips(newPlacedChips);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Run placement calculation initially and on resize
    updateChipPlacements();
    const handleResize = () => {
      updateChipPlacements();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Also run shortly after mount when fonts and animations establish sizes
    const t1 = setTimeout(updateChipPlacements, 100);
    const t2 = setTimeout(updateChipPlacements, 500);
    const t3 = setTimeout(updateChipPlacements, 1200);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    let targetX = container.clientWidth * 0.45;
    let targetY = container.clientHeight * 0.4;
    let currentX = targetX;
    let currentY = targetY;
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [updateChipPlacements]);

  const lensRadius = 140;

  return (
    <div
      ref={containerRef}
      className="truth-lens-container"
      aria-hidden="true"
      data-decorative="true"
    >
      {/* Amber Spotlight Glow centered on lens */}
      <div
        className="lens-spotlight"
        data-decorative="true"
        style={{
          transform: `translate(${lensPos.x - 200}px, ${lensPos.y - 200}px)`,
        }}
      />

      {/* Dim Base Claims Layer (outside lens) */}
      <div className="claims-layer dim-layer" data-decorative="true">
        {placedChips
          .filter((item) => item.visible)
          .map((item) => (
            <div
              key={item.id}
              className="claim-item dim-claim"
              data-decorative="true"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
              }}
            >
              <span className="claim-dot" />
              <span className="claim-text">{item.claim}</span>
            </div>
          ))}
      </div>

      {/* Resolved Proof Layer (revealed only inside the lens circular mask) */}
      <div
        className="claims-layer proof-layer"
        data-decorative="true"
        style={{
          clipPath: `circle(${lensRadius}px at ${lensPos.x}px ${lensPos.y}px)`,
          WebkitClipPath: `circle(${lensRadius}px at ${lensPos.x}px ${lensPos.y}px)`,
        }}
      >
        {placedChips
          .filter((item) => item.visible)
          .map((item) => (
            <div
              key={item.id}
              className="claim-item proof-claim"
              data-decorative="true"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
              }}
            >
              <div className={`proof-chip proof-${item.proof.status}`} data-decorative="true">
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

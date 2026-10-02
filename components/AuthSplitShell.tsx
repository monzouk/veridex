'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';
import EvidenceCanvas from '@/components/EvidenceCanvas';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface AuthSplitShellProps {
  children: React.ReactNode;
}

const PROOF_STATEMENTS = [
  {
    quote: 'Proof over assertion. Always calculated, never typed.',
    author: 'The Veridex Principle',
  },
  {
    quote: 'Real-time control intelligence grounded in cryptographic evidence.',
    author: 'Continuous Verification',
  },
  {
    quote: 'Know which controls are genuinely working before an auditor asks.',
    author: 'Audit Readiness',
  },
];

export default function AuthSplitShell({ children }: AuthSplitShellProps) {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % PROOF_STATEMENTS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auth-shell">
      {/* Mobile Top Brand Strip (visible on mobile only) */}
      <header className="auth-mobile-header mobile-only">
        <Link href="/" className="auth-mobile-back" aria-label="Return to homepage">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <Link href="/" aria-label="Veridex home">
          <AnimatedLogo className="auth-brand-logo-mobile" width={140} height={32} />
        </Link>
      </header>

      <div className="auth-split-layout">
        {/* Left Brand Panel (Desktop only) */}
        <aside className="auth-brand-panel desktop-only" aria-label="Veridex proof intelligence">
          {/* Background Canvas & Atmospheric Orbs */}
          <div className="auth-canvas-container" aria-hidden="true">
            <EvidenceCanvas />
            <div className="auth-panel-glow" />
            <div className="auth-panel-orb" />
          </div>

          <div className="auth-brand-content">
            {/* Top Brand Link */}
            <div className="auth-brand-top">
              <Link href="/" className="auth-back-link">
                <ArrowLeft size={14} aria-hidden="true" /> Back to website
              </Link>
              <div className="auth-brand-logo-wrap">
                <AnimatedLogo className="auth-brand-logo-desktop" width={180} height={40} />
              </div>
            </div>

            {/* Rotating Proof Statements */}
            <div className="auth-quote-card">
              <div className="quote-badge">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>EVIDENCE INTEGRITY</span>
              </div>

              <div className="quote-viewport" aria-live="polite">
                {PROOF_STATEMENTS.map((item, index) => (
                  <div
                    key={item.author}
                    className={`quote-slide ${index === activeQuoteIndex ? 'is-active' : ''}`}
                    aria-hidden={index !== activeQuoteIndex}
                  >
                    <blockquote className="quote-text">&ldquo;{item.quote}&rdquo;</blockquote>
                    <cite className="quote-author">{item.author}</cite>
                  </div>
                ))}
              </div>

              {/* Slide Indicator Dots */}
              <div className="quote-dots" aria-hidden="true">
                {PROOF_STATEMENTS.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`quote-dot ${index === activeQuoteIndex ? 'is-active' : ''}`}
                    onClick={() => setActiveQuoteIndex(index)}
                    aria-label={`Show quote ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Panel Bottom Seal */}
            <footer className="auth-brand-footer">
              <span>Truth in every control.</span>
              <span className="footer-bullet">•</span>
              <span>Ed25519 Signed Evidence</span>
            </footer>
          </div>
        </aside>

        {/* Right Form Card / Main Content */}
        <main className="auth-main-panel">
          <div className="auth-card-container">{children}</div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleGauge,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Menu,
  ScanSearch,
  ShieldCheck,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Platform', href: '#platform' },
  { name: 'Solutions', href: '#solutions' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Resources', href: '#resources' },
];

const features = [
  {
    icon: ScanSearch,
    eyebrow: '01 / OBSERVE',
    title: 'See what others miss.',
    copy: 'Turn scattered signals into a clear, continuously updated view of risk across your organization.',
  },
  {
    icon: FileCheck2,
    eyebrow: '02 / VERIFY',
    title: 'Make every claim count.',
    copy: 'Validate evidence at the source and replace assumptions with decisions you can stand behind.',
  },
  {
    icon: CircleGauge,
    eyebrow: '03 / CONTROL',
    title: 'Move with confidence.',
    copy: 'Keep controls measurable, accountable, and ready for the next moment that matters.',
  },
];

const faqs = [
  [
    'What is Veridex?',
    'Veridex is a compliance intelligence platform that connects requirements, controls, SOPs, and evidence to calculate whether each control is truly working—never relying on manual self-reporting.',
  ],
  [
    'Who is Veridex for?',
    'Security, compliance, risk, and leadership teams in regulated industries (pharma, medtech, AI, and enterprise tech) where proof of operational integrity is mandatory.',
  ],
  [
    'How quickly can we get started?',
    'Start with one control surface and expand as your team sees value. Guided onboarding creates proof-grounded momentum in days, not quarters.',
  ],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [utcTime, setUtcTime] = useState('08:42:16 UTC');
  const [trustIndex, setTrustIndex] = useState(98.4);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const revealRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  // Hydration-safe live UTC Clock & dynamic trust index tick
  useEffect(() => {
    setMounted(true);

    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };

    updateClock();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const clockInterval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        updateClock();
      }
    }, 1000);

    const trustValues = [98.4, 98.6, 98.2, 98.7, 98.3, 98.5];
    let trustIndexCursor = 0;

    const trustInterval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        trustIndexCursor = (trustIndexCursor + 1) % trustValues.length;
        setTrustIndex(trustValues[trustIndexCursor]);
      }
    }, 3800);

    return () => {
      clearInterval(clockInterval);
      clearInterval(trustInterval);
    };
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const root = revealRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ? `${el.dataset.delay}ms` : '0ms';
            el.style.transitionDelay = delay;
            el.classList.add('is-visible');
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  // Trap focus and handle Escape for full-screen navigation overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!menuOpen) return;

      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const overlay = menuRef.current;
        if (!overlay) return;
        const focusable = overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Focus first link in overlay
      setTimeout(() => {
        const firstLink = menuRef.current?.querySelector<HTMLElement>('a');
        firstLink?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Pointer tilt for Live Control Signal Card (fine pointers only, up to 6 deg)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Bounded to max 6 degrees
    setCardTilt({
      x: Number((-y * 12).toFixed(2)),
      y: Number((x * 12).toFixed(2)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCardTilt({ x: 0, y: 0 });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
  };

  return (
    <main className="site-shell" ref={revealRef}>
      {/* Header */}
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Veridex home">
          <Image
            src="/veridex-logo.svg"
            alt="VERIDEX - Truth in every control"
            width={185}
            height={40}
            priority
            className="brand-logo"
          />
        </a>

        {/* Desktop Navigation */}
        <nav className="main-nav desktop-only" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a href={item.href} key={item.name}>
              {item.name}
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          ))}
          <a href="/login" className="login-link">
            Login
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </nav>

        <div className="header-actions">
          <a className="button button-header" href="#contact">
            Talk to us <ArrowRight size={14} aria-hidden="true" />
          </a>
          <button
            ref={menuToggleRef}
            className="menu-toggle"
            onClick={() => setMenuOpen((val) => !val)}
            aria-label={menuOpen ? 'Close menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-overlay-nav"
          >
            {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      <div
        id="mobile-overlay-nav"
        ref={menuRef}
        className={`mobile-nav-overlay ${menuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="overlay-header">
          <a className="brand" href="#top" onClick={() => setMenuOpen(false)} aria-label="Veridex home">
            <Image
              src="/veridex-logo.svg"
              alt="VERIDEX"
              width={160}
              height={35}
              className="brand-logo"
            />
          </a>
          <button
            className="overlay-close"
            onClick={() => {
              setMenuOpen(false);
              menuToggleRef.current?.focus();
            }}
            aria-label="Close menu"
          >
            <X size={26} aria-hidden="true" />
          </button>
        </div>

        <nav className="overlay-nav-links" aria-label="Mobile menu links">
          {navItems.map((item) => (
            <a
              href={item.href}
              key={item.name}
              className="overlay-link"
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.name}</span>
              <ArrowRight size={20} aria-hidden="true" />
            </a>
          ))}
          <a
            href="/login"
            className="overlay-link overlay-login"
            onClick={() => setMenuOpen(false)}
          >
            <span>Login</span>
            <ArrowRight size={20} aria-hidden="true" />
          </a>
        </nav>

        <div className="overlay-footer">
          <a
            className="button button-primary overlay-cta"
            href="#contact"
            onClick={() => setMenuOpen(false)}
          >
            Talk to us <ArrowRight size={17} aria-hidden="true" />
          </a>
          <p className="overlay-tagline">Truth in every control.</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero" id="top">
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-container">
          {/* Left Column on Desktop / Top Column on Mobile */}
          <div className="hero-content">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> Control intelligence, redefined
            </p>
            <h1>
              Truth in every <span>control.</span>
            </h1>
            <p className="hero-copy">
              Veridex gives your team the clarity to find what matters, prove what is true, and act before risk becomes reality.
            </p>
            <div className="hero-buttons">
              <a className="button button-primary" href="#contact">
                Discover Veridex <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="button button-quiet" href="#platform">
                Explore the platform <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="hero-proof">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Built for teams where trust is non-negotiable</span>
            </div>
          </div>

          {/* Right Column on Desktop / Centered Below Trust Line on Phones */}
          <div
            className="hero-visual"
            aria-label="Live control signal preview"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="hero-card"
              style={{
                transform: `perspective(1000px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
              }}
            >
              <div className="card-topline">
                <div className="card-topline-left">
                  <span className="live-dot" aria-hidden="true" />
                  <span>LIVE CONTROL SIGNAL</span>
                </div>
                <span className="card-time tabular-nums">{mounted ? utcTime : '08:42:16 UTC'}</span>
              </div>

              <div className="card-tag-row">
                <span className="illustrative-tag">Illustrative signal</span>
              </div>

              <div className="signal-visual">
                {/* Responsive Scalable SVG Rings */}
                <svg className="signal-rings-svg" viewBox="0 0 240 240" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F29A3D" />
                      <stop offset="60%" stopColor="#FFC46B" />
                      <stop offset="100%" stopColor="#4F6440" />
                    </linearGradient>
                    <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(242, 154, 61, 0.12)" />
                      <stop offset="100%" stopColor="rgba(14, 16, 19, 0.95)" />
                    </radialGradient>
                  </defs>

                  {/* Outer subtle guide ring */}
                  <circle cx="120" cy="120" r="110" stroke="rgba(42, 46, 52, 0.85)" strokeWidth="1" strokeDasharray="3 4" />

                  {/* Mid concentric track */}
                  <circle cx="120" cy="120" r="92" stroke="rgba(168, 164, 150, 0.14)" strokeWidth="2.5" />

                  {/* Dynamic Progress Arc */}
                  <circle
                    cx="120"
                    cy="120"
                    r="92"
                    stroke="url(#ring-gradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="578"
                    strokeDashoffset={578 * (1 - trustIndex / 100)}
                    transform="rotate(-90 120 120)"
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                  />

                  {/* Inner secondary ring */}
                  <circle cx="120" cy="120" r="74" stroke="rgba(79, 100, 64, 0.4)" strokeWidth="1" />

                  {/* Core Circle */}
                  <circle cx="120" cy="120" r="52" fill="url(#core-glow)" stroke="rgba(242, 189, 115, 0.45)" strokeWidth="1.2" />
                </svg>

                {/* Core Overlay with Fingerprint and Tabular Index */}
                <div className="signal-core">
                  <Fingerprint size={26} aria-hidden="true" />
                  <span className="tabular-nums">{trustIndex.toFixed(1)}</span>
                  <small>TRUST INDEX</small>
                </div>
              </div>

              <div className="signal-footer">
                <span className="footer-label">Evidence integrity</span>
                <strong className="footer-status">
                  Verified <Check size={14} aria-hidden="true" />
                </strong>
              </div>
            </div>

            <div className="float-badge">
              <span className="badge-pulse" aria-hidden="true" />
              <strong>CONTROL HEALTH</strong>
              <span className="badge-delta tabular-nums">+12.8%</span>
            </div>
          </div>
        </div>

        <a className="scroll-hint desktop-only" href="#platform" aria-label="Scroll to explore features">
          <span>Scroll to explore</span>
          <span className="scroll-arrow">
            <ArrowRight size={15} aria-hidden="true" />
          </span>
        </a>
      </section>

      {/* Ticker Section */}
      <section className="ticker" aria-label="Veridex capabilities" data-reveal>
        <span>CONTROL INTELLIGENCE</span>
        <i aria-hidden="true" />
        <span>TRUSTED EVIDENCE</span>
        <i aria-hidden="true" />
        <span>DECISIVE ACTION</span>
        <i aria-hidden="true" />
        <span>CONTROL INTELLIGENCE</span>
      </section>

      {/* Platform Advantage Section */}
      <section className="section platform-section" id="platform">
        <div className="section-heading split-heading" data-reveal>
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> The Veridex advantage
            </p>
            <h2>
              Make certainty<br />
              <em>operational.</em>
            </h2>
          </div>
          <p className="section-intro">
            When every decision carries weight, visibility is not enough. Veridex connects the signal, the evidence, and the action in one intelligent control layer.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, eyebrow, title, copy }, index) => (
            <article className="feature-card" key={eyebrow} data-reveal data-delay={index * 120}>
              <div className="feature-icon">
                <Icon size={22} aria-hidden="true" />
              </div>
              <p className="feature-eyebrow">{eyebrow}</p>
              <h3>{title}</h3>
              <p>{copy}</p>
              <a className="circle-link" href="#contact" aria-label={`Learn more about ${title}`}>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Solutions / Dark Panel */}
      <section className="dark-panel" id="solutions">
        <div className="section dark-panel-inner">
          <div className="panel-copy" data-reveal>
            <p className="eyebrow light">
              <span className="eyebrow-line" aria-hidden="true" /> One source of truth
            </p>
            <h2>
              Risk moves fast.<br />
              <em>Your controls should too.</em>
            </h2>
            <p>
              From first signal to final decision, Veridex helps teams shorten the distance between knowing and doing.
            </p>
            <a className="button button-outline" href="#contact">
              See how it works <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="control-map" data-reveal data-delay="200" aria-label="Control map relationship diagram">
            <div className="map-label map-label-top">
              SIGNAL <span>01</span>
            </div>
            <div className="map-label map-label-right">
              EVIDENCE <span>02</span>
            </div>
            <div className="map-label map-label-bottom">
              ACTION <span>03</span>
            </div>
            <div className="map-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="map-center">
              <Activity size={26} aria-hidden="true" />
              <strong>VERIDEX</strong>
              <small>CONTROL LAYER</small>
            </div>
            <div className="map-node node-one" role="img" aria-label="Signal node">
              <ScanSearch size={17} aria-hidden="true" />
            </div>
            <div className="map-node node-two" role="img" aria-label="Evidence node">
              <FileCheck2 size={17} aria-hidden="true" />
            </div>
            <div className="map-node node-three" role="img" aria-label="Action node">
              <LockKeyhole size={17} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* Proof / Testimonial Section */}
      <section className="section proof-section" id="resources" data-reveal>
        <div className="quote-mark" aria-hidden="true">&ldquo;</div>
        <blockquote>
          Veridex turns control from a periodic exercise into a living advantage.
        </blockquote>
        <div className="proof-meta">
          <span className="proof-avatar" aria-hidden="true">A</span>
          <span>
            <strong>Alex Morgan</strong>
            <small>VP, Risk &amp; Operations</small>
          </span>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section faq-section" id="company">
        <div className="faq-intro" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> Clear by design
          </p>
          <h2>
            Questions,<br />
            <em>answered.</em>
          </h2>
          <p>Everything you need to take the next step with confidence.</p>
        </div>
        <div className="faq-list" data-reveal data-delay="150">
          {faqs.map(([question, answer], index) => (
            <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}>
              <button
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                aria-expanded={openFaq === index}
              >
                <span>0{index + 1}</span>
                <strong>{question}</strong>
                <ChevronDown size={19} aria-hidden="true" />
              </button>
              {openFaq === index && <p>{answer}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-glow" aria-hidden="true" />
        <div className="contact-content" data-reveal>
          <p className="eyebrow light">
            <span className="eyebrow-line" aria-hidden="true" /> Your next control advantage
          </p>
          <h2>
            Ready to see<br />
            <em>what is true?</em>
          </h2>
          <p>Get the Veridex briefing and start building a clearer way forward.</p>
          {submitted ? (
            <div className="success-message" role="status">
              <Check size={18} aria-hidden="true" /> You are on the list. We will be in touch shortly.
            </div>
          ) : (
            <form className="email-form" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Work email address"
                aria-label="Work email address"
                required
              />
              <button type="submit" aria-label="Submit email">
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer" data-reveal>
        <a className="brand" href="#top" aria-label="Veridex home">
          <Image
            src="/veridex-logo.svg"
            alt="VERIDEX"
            width={160}
            height={36}
            className="brand-logo"
          />
        </a>

        <p>Truth in every control.</p>

        <div className="footer-links">
          <a href="#platform">Platform</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
          <a href="#contact">Contact</a>
        </div>

        <small>&copy; 2026 Veridex. All rights reserved.</small>
      </footer>
    </main>
  );
}

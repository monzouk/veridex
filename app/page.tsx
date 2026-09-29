'use client';

import { useEffect, useRef, useState } from 'react';
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

const navItems = ['Platform', 'Solutions', 'Resources', 'Company'];

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
  ['What is Veridex?', 'Veridex is a control intelligence platform that helps modern teams see, verify, and act on the signals behind operational risk.'],
  ['Who is Veridex for?', 'Security, compliance, operations, and leadership teams use Veridex when the cost of uncertainty is too high.'],
  ['How quickly can we get started?', 'Start with one control surface and expand as your team sees value. Our guided rollout is designed to create momentum in days, not quarters.'],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const revealRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = revealRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (items.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delay = el.dataset.delay ? `${el.dataset.delay}ms` : '0ms';
          el.style.transitionDelay = delay;
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
  };

  return (
    <main className="site-shell" ref={revealRef}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Veridex home">
          <span className="brand-mark">V</span>
          <span className="brand-name">VERIDEX<span className="brand-dot">®</span></span>
        </a>

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          {navItems.map((item) => (
            <a href={`#${item.toLowerCase()}`} key={item} onClick={() => setMenuOpen(false)}>
              {item}
              <ArrowUpRight size={13} />
            </a>
          ))}
          <a className="nav-cta mobile-cta" href="#contact" onClick={() => setMenuOpen(false)}>Talk to us <ArrowRight size={15} /></a>
        </nav>

        <div className="header-actions">
          <a className="text-link" href="#contact">Talk to us <ArrowUpRight size={14} /></a>
          <button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-grid" />
        <div className="hero-content">
          <p className="eyebrow"><span className="eyebrow-line" /> Control intelligence, redefined</p>
          <h1>Truth in every <span>control.</span></h1>
          <p className="hero-copy">Veridex gives your team the clarity to find what matters, prove what is true, and act before risk becomes reality.</p>
          <div className="hero-buttons">
            <a className="button button-primary" href="#contact">Discover Veridex <ArrowRight size={17} /></a>
            <a className="button button-quiet" href="#platform">Explore the platform <ArrowUpRight size={16} /></a>
          </div>
          <div className="hero-proof"><ShieldCheck size={17} /><span>Built for teams where trust is non-negotiable</span></div>
        </div>
        <div className="hero-visual" aria-label="Live control signal preview">
          <div className="hero-card">
            <div className="card-topline"><span className="live-dot" /> LIVE CONTROL SIGNAL <span className="card-time">08:42:16 UTC</span></div>
            <div className="signal-visual"><div className="signal-ring ring-large" /><div className="signal-ring ring-small" /><div className="signal-core"><Fingerprint size={28} /><span>98.4</span><small>TRUST INDEX</small></div></div>
            <div className="signal-footer"><span>Evidence integrity</span><strong>Verified <Check size={14} /></strong></div>
          </div>
          <div className="float-badge"><span className="badge-pulse" /><strong>CONTROL HEALTH</strong><span>+12.8%</span></div>
        </div>
        <div className="hero-side-note"><span className="note-line" /> Built for teams where trust is non-negotiable</div>
        <a className="scroll-hint" href="#platform"><span>Scroll to explore</span><span className="scroll-arrow"><ArrowRight size={15} /></span></a>
      </section>

      <section className="ticker" aria-label="Veridex capabilities" data-reveal>
        <span>CONTROL INTELLIGENCE</span><i /> <span>TRUSTED EVIDENCE</span><i /> <span>DECISIVE ACTION</span><i /> <span>CONTROL INTELLIGENCE</span>
      </section>

      <section className="section platform-section" id="platform">
        <div className="section-heading split-heading" data-reveal>
          <div><p className="eyebrow"><span className="eyebrow-line" /> The Veridex advantage</p><h2>Make certainty<br /><em>operational.</em></h2></div>
          <p className="section-intro">When every decision carries weight, visibility is not enough. Veridex connects the signal, the evidence, and the action in one intelligent control layer.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, eyebrow, title, copy }, index) => <article className="feature-card" key={eyebrow} data-reveal data-delay={index * 120}><div className="feature-icon"><Icon size={22} /></div><p className="feature-eyebrow">{eyebrow}</p><h3>{title}</h3><p>{copy}</p><a className="circle-link" href="#contact" aria-label={`Learn more about ${title}`}><ArrowUpRight size={17} /></a></article>)}
        </div>
      </section>

      <section className="dark-panel" id="solutions">
        <div className="section dark-panel-inner">
          <div className="panel-copy" data-reveal><p className="eyebrow light"><span className="eyebrow-line" /> One source of truth</p><h2>Risk moves fast.<br /><em>Your controls should too.</em></h2><p>From first signal to final decision, Veridex helps teams shorten the distance between knowing and doing.</p><a className="button button-outline" href="#contact">See how it works <ArrowRight size={17} /></a></div>
          <div className="control-map" data-reveal data-delay="200"><div className="map-label map-label-top">SIGNAL <span>01</span></div><div className="map-label map-label-right">EVIDENCE <span>02</span></div><div className="map-label map-label-bottom">ACTION <span>03</span></div><div className="map-lines"><span /><span /><span /></div><div className="map-center"><Activity size={26} /><strong>VERIDEX</strong><small>CONTROL LAYER</small></div><div className="map-node node-one"><ScanSearch size={17} /></div><div className="map-node node-two"><FileCheck2 size={17} /></div><div className="map-node node-three"><LockKeyhole size={17} /></div></div>
        </div>
      </section>

      <section className="section proof-section" id="resources" data-reveal>
        <div className="quote-mark">&ldquo;</div><blockquote>Veridex turns control from a periodic exercise into a living advantage.</blockquote><div className="proof-meta"><span className="proof-avatar">A</span><span><strong>Alex Morgan</strong><small>VP, Risk &amp; Operations</small></span></div>
      </section>

      <section className="section faq-section" id="company">
        <div className="faq-intro" data-reveal><p className="eyebrow"><span className="eyebrow-line" /> Clear by design</p><h2>Questions,<br /><em>answered.</em></h2><p>Everything you need to take the next step with confidence.</p></div>
        <div className="faq-list" data-reveal data-delay="150">{faqs.map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>0{index + 1}</span><strong>{question}</strong><ChevronDown size={19} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div>
      </section>

      <section className="contact-section" id="contact"><div className="contact-glow" /><div className="contact-content" data-reveal><p className="eyebrow light"><span className="eyebrow-line" /> Your next control advantage</p><h2>Ready to see<br /><em>what is true?</em></h2><p>Get the Veridex briefing and start building a clearer way forward.</p>{submitted ? <div className="success-message"><Check size={18} /> You are on the list. We will be in touch shortly.</div> : <form className="email-form" onSubmit={handleSubmit}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Work email address" aria-label="Work email address" required /><button type="submit" aria-label="Submit email"><ArrowRight size={19} /></button></form>}</div></section>

      <footer className="site-footer" data-reveal><a className="brand" href="#top"><span className="brand-mark">V</span><span className="brand-name">VERIDEX<span className="brand-dot">®</span></span></a><p>Truth in every control.</p><div className="footer-links"><a href="#platform">Platform</a><a href="#solutions">Solutions</a><a href="#resources">Resources</a><a href="#contact">Contact</a></div><small>&copy; 2026 Veridex. All rights reserved.</small></footer>
    </main>
  );
}

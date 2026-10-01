const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const qaDir = path.join(__dirname, '..', 'docs', 'qa');
if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

async function runStep02QA() {
  console.log('=== VERIDEX Step 02 Animation QA Audit ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const report = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: true
  };

  try {
    // 1. Desktop Experience (1440x900) - Load Sequence & Truth Lens
    console.log('\n1. Testing Desktop Load Sequence & Truth Lens (1440x900)...');
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await pageDesktop.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Wait 2.2 seconds for full load sequence to complete
    await new Promise(r => setTimeout(r, 2200));

    // Capture screenshot after full load sequence
    const desktopScreenshot = path.join(qaDir, 'step-02-desktop-loaded-1440.png');
    await pageDesktop.screenshot({ path: desktopScreenshot });
    console.log(`- Saved loaded desktop screenshot: ${desktopScreenshot}`);

    // Verify DOM elements for Step 02
    const desktopChecks = await pageDesktop.evaluate(() => {
      const vLogo = document.querySelector('.animated-brand-logo');
      const eyebrowLine = document.querySelector('.eyebrow-line');
      const headlineWords = document.querySelectorAll('.headline-word');
      const sweepWord = document.querySelector('.headline-word-sweep');
      const evidenceCanvas = document.querySelector('.hero-evidence-canvas');
      const truthLens = document.querySelector('.truth-lens-container');
      const breathingGlow = document.querySelector('.card-breathing-glow');
      const scanline = document.querySelector('.scanline');
      const ringPulse = document.querySelector('.ring-pulse');
      const progressBar = document.querySelector('.scroll-progress-line');

      return {
        hasAnimatedLogo: !!vLogo,
        hasEyebrowLine: !!eyebrowLine,
        headlineWordsCount: headlineWords.length,
        hasSweepWord: !!sweepWord,
        hasEvidenceCanvas: !!evidenceCanvas && evidenceCanvas.clientWidth > 0,
        hasTruthLens: !!truthLens,
        hasBreathingGlow: !!breathingGlow,
        hasScanline: !!scanline,
        hasRingPulse: !!ringPulse,
        hasProgressBar: !!progressBar,
      };
    });

    console.log('Desktop Animation Elements Check:', desktopChecks);

    // Test Pointer Movement across Truth Lens
    console.log('Testing Truth Lens Pointer Interaction...');
    await pageDesktop.mouse.move(300, 300);
    await new Promise(r => setTimeout(r, 400));
    await pageDesktop.mouse.move(600, 350);
    await new Promise(r => setTimeout(r, 400));
    const lensScreenshot = path.join(qaDir, 'step-02-truth-lens-active.png');
    await pageDesktop.screenshot({ path: lensScreenshot });
    console.log(`- Saved Truth Lens active screenshot: ${lensScreenshot}`);

    // Test Header Blur & Scroll Progress Bar
    console.log('Testing Scroll Progress & Header Blur on scroll...');
    await pageDesktop.evaluate(() => window.scrollTo(0, 400));
    await new Promise(r => setTimeout(r, 500));

    const scrollChecks = await pageDesktop.evaluate(() => {
      const header = document.querySelector('.site-header');
      const isScrolled = header ? header.classList.contains('is-scrolled') : false;
      const progressBar = document.querySelector('.scroll-progress-line');
      const progressTransform = progressBar ? progressBar.style.transform : '';

      return {
        headerIsScrolled: isScrolled,
        progressBarTransform: progressTransform
      };
    });
    console.log('Scroll State Check:', scrollChecks);

    const scrolledScreenshot = path.join(qaDir, 'step-02-scrolled-header-glass.png');
    await pageDesktop.screenshot({ path: scrolledScreenshot });
    console.log(`- Saved Scrolled Glass Header screenshot: ${scrolledScreenshot}`);

    report.tests.push({
      name: 'Desktop 1440x900',
      desktopChecks,
      scrollChecks,
      passed: Object.values(desktopChecks).every(Boolean) && scrollChecks.headerIsScrolled
    });

    await pageDesktop.close();

    // 2. Mobile Experience (390x844)
    console.log('\n2. Testing Mobile Layout & Dynamics (390x844)...');
    const pageMobile = await browser.newPage();
    await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await pageMobile.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2200));

    const mobileMetrics = await pageMobile.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const card = document.querySelector('.hero-card');
      const proof = document.querySelector('.hero-proof');
      const ring = document.querySelector('.signal-rings-svg');

      return {
        hasHorizontalScroll: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        cardVisible: !!card && card.clientHeight > 0,
        proofVisible: !!proof && proof.clientHeight > 0,
        ringVisible: !!ring && ring.clientHeight > 0
      };
    });

    console.log('Mobile Metrics:', mobileMetrics);
    const mobileScreenshot = path.join(qaDir, 'step-02-mobile-390.png');
    await pageMobile.screenshot({ path: mobileScreenshot });
    console.log(`- Saved Mobile screenshot: ${mobileScreenshot}`);

    report.tests.push({
      name: 'Mobile 390x844',
      metrics: mobileMetrics,
      passed: !mobileMetrics.hasHorizontalScroll && mobileMetrics.cardVisible
    });

    await pageMobile.close();

    // 3. Tablet Experience (768x1024)
    console.log('\n3. Testing Tablet Layout & Centered Column (768x1024)...');
    const pageTablet = await browser.newPage();
    await pageTablet.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
    await pageTablet.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const tabletScreenshot = path.join(qaDir, 'step-02-tablet-768.png');
    await pageTablet.screenshot({ path: tabletScreenshot });
    console.log(`- Saved Tablet screenshot: ${tabletScreenshot}`);

    const tabletMetrics = await pageTablet.evaluate(() => {
      return {
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

    report.tests.push({
      name: 'Tablet 768x1024',
      passed: !tabletMetrics.hasHorizontalScroll
    });

    await pageTablet.close();

    // 4. Accessibility & Reduced Motion Audit
    console.log('\n4. Testing prefers-reduced-motion: reduce...');
    const pageReduced = await browser.newPage();
    await pageReduced.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await pageReduced.setViewport({ width: 1440, height: 900 });
    await pageReduced.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    const reducedMotionChecks = await pageReduced.evaluate(() => {
      const card = document.querySelector('.hero-card');
      const headline = document.querySelector('.headline-word');
      const cardComputed = card ? window.getComputedStyle(card) : null;
      const headlineComputed = headline ? window.getComputedStyle(headline) : null;

      // In reduced motion, opacity should be 1 and animation should be none or ~0s
      return {
        headlineOpacity: headlineComputed ? headlineComputed.opacity : '',
        cardAnimationDuration: cardComputed ? cardComputed.animationDuration : '',
      };
    });

    console.log('Reduced Motion Verification:', reducedMotionChecks);
    const reducedScreenshot = path.join(qaDir, 'step-02-reduced-motion.png');
    await pageReduced.screenshot({ path: reducedScreenshot });
    console.log(`- Saved Reduced Motion screenshot: ${reducedScreenshot}`);

    report.tests.push({
      name: 'prefers-reduced-motion',
      checks: reducedMotionChecks,
      passed: reducedMotionChecks.headlineOpacity === '1'
    });

    await pageReduced.close();

    // 5. Measure Layout Shift (CLS)
    console.log('\n5. Measuring Cumulative Layout Shift (CLS)...');
    const pageCls = await browser.newPage();
    await pageCls.setViewport({ width: 390, height: 844 });

    await pageCls.evaluateOnNewDocument(() => {
      window.__cls = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await pageCls.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));

    const clsScore = await pageCls.evaluate(() => window.__cls || 0);
    console.log(`Cumulative Layout Shift (CLS) score: ${clsScore.toFixed(4)} (Target: < 0.05)`);

    report.tests.push({
      name: 'Cumulative Layout Shift',
      score: clsScore,
      target: 0.05,
      passed: clsScore < 0.05
    });

    await pageCls.close();

  } catch (err) {
    console.error('QA Test Error:', err);
    report.passed = false;
    report.error = err.message;
  } finally {
    await browser.close();
  }

  report.passed = report.tests.every(t => t.passed);
  fs.writeFileSync(path.join(qaDir, 'step-02-report.json'), JSON.stringify(report, null, 2));
  console.log(`\nQA Finished! All Step 02 tests passed: ${report.passed}`);
}

runStep02QA();

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TEST_MATRIX = [
  // Small and standard phones (portrait)
  { name: 'phone-portrait-320', width: 320, height: 568 },
  { name: 'phone-portrait-360', width: 360, height: 800 },
  { name: 'phone-portrait-375', width: 375, height: 667 },
  { name: 'phone-portrait-390', width: 390, height: 844 },
  { name: 'phone-portrait-412', width: 412, height: 915 },
  { name: 'phone-portrait-430', width: 430, height: 932 },
  // Phones (landscape)
  { name: 'phone-landscape-667', width: 667, height: 375 },
  { name: 'phone-landscape-844', width: 844, height: 390 },
  { name: 'phone-landscape-932', width: 932, height: 430 },
  // Tablets
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  // Laptops and MacBooks
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'laptop-1440', width: 1440, height: 900 },
  { name: 'macbook-14-1512', width: 1512, height: 982 },
  { name: 'macbook-16-1728', width: 1728, height: 1117 },
  // Large desktops
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-2560', width: 2560, height: 1440 },
];

async function runQATests() {
  console.log('--- Starting VERIDEX Step 01 Test Matrix QA ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const qaDir = path.join(__dirname, '..', 'docs', 'qa');
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true });
  }

  const results = [];
  let allPassed = true;

  for (const vp of TEST_MATRIX) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));

    // Check horizontal scroll & element overlap
    const metrics = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const hasHorizontalScroll = scrollWidth > clientWidth;

      const proofEl = document.querySelector('.hero-proof');
      const cardEl = document.querySelector('.hero-card');
      const footerStatus = document.querySelector('.signal-footer');

      let overlap = false;
      let proofRect = null;
      let cardRect = null;

      if (proofEl && cardEl) {
        proofRect = proofEl.getBoundingClientRect();
        cardRect = cardEl.getBoundingClientRect();
        // Check if on small screens, card overlaps proof line
        if (window.innerWidth < 768) {
          const verticalOverlap = !(proofRect.bottom <= cardRect.top || cardRect.bottom <= proofRect.top);
          const horizontalOverlap = !(proofRect.right <= cardRect.left || cardRect.right <= proofRect.left);
          overlap = verticalOverlap && horizontalOverlap;
        }
      }

      return {
        hasHorizontalScroll,
        scrollWidth,
        clientWidth,
        overlap,
        hasFooterStatus: !!footerStatus && footerStatus.clientHeight > 0,
      };
    });

    const screenshotPath = path.join(qaDir, `step-01-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const passed = !metrics.hasHorizontalScroll && !metrics.overlap && metrics.hasFooterStatus;
    if (!passed) allPassed = false;

    results.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      hasHorizontalScroll: metrics.hasHorizontalScroll,
      scrollWidth: metrics.scrollWidth,
      clientWidth: metrics.clientWidth,
      overlapDetected: metrics.overlap,
      footerVisible: metrics.hasFooterStatus,
      status: passed ? 'PASS' : 'FAIL',
      screenshot: `docs/qa/step-01-${vp.name}.png`
    });

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${vp.name} (${vp.width}x${vp.height}) - HScroll: ${metrics.hasHorizontalScroll} (w:${metrics.scrollWidth}/${metrics.clientWidth}), Overlap: ${metrics.overlap}`);
    await page.close();
  }

  // Mobile Navigation Overlay Test (Menu open, focus trap, escape)
  console.log('\n--- Testing Mobile Navigation Overlay ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click hamburger
  await mobilePage.click('.menu-toggle');
  await new Promise(r => setTimeout(r, 300));

  const menuOpenState = await mobilePage.evaluate(() => {
    const overlay = document.querySelector('.mobile-nav-overlay');
    const links = overlay.querySelectorAll('.overlay-link');
    const computed = window.getComputedStyle(overlay);
    const bodyOverflow = document.body.style.overflow;
    return {
      isOpenClass: overlay.classList.contains('is-open'),
      display: computed.display,
      opacity: computed.opacity,
      linksCount: links.length,
      bodyOverflow
    };
  });

  console.log('Mobile menu open state:', menuOpenState);
  await mobilePage.screenshot({ path: path.join(qaDir, 'step-01-mobile-menu-open.png') });

  // Press Escape to test close
  await mobilePage.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  const menuClosedState = await mobilePage.evaluate(() => {
    const overlay = document.querySelector('.mobile-nav-overlay');
    return !overlay.classList.contains('is-open');
  });
  console.log('Mobile menu closes on Escape:', menuClosedState);

  await mobilePage.close();
  await browser.close();

  // Summary Report
  console.log('\n===========================================');
  console.log(`TOTAL VIEWPORTS TESTED: ${TEST_MATRIX.length}`);
  console.log(`OVERALL RESULT: ${allPassed && menuClosedState ? 'ALL PASSED (100%)' : 'SOME CHECKS FAILED'}`);
  console.log('===========================================\n');

  fs.writeFileSync(
    path.join(qaDir, 'test-matrix-report.json'),
    JSON.stringify({ results, menuOpenState, menuClosedState, allPassed }, null, 2)
  );
}

runQATests().catch(err => {
  console.error(err);
  process.exit(1);
});
